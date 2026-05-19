import * as core from '@actions/core';
import * as fs from 'fs';
import { authenticate } from './auth';
import {
  closeMilestone,
  getMilestoneId,
  getMilestones,
  RepositoryInformation,
} from './milestones';
import axios, { isAxiosError } from 'axios';

/**
 * Implements the main workflow.
 *
 * authenticate -> get milestones -> close milestone
 */
export async function run(): Promise<void> {
  await validateSubscription();
  const milestoneName = core.getInput('milestone_name');

  try {
    const repoInformation = getRepositoryInformation();

    await authenticate();

    const milestones = await getMilestones(repoInformation);
    const id = getMilestoneId(milestones, milestoneName);
    if (id == null) {
      handleMissingMilestone();
      return;
    }

    await closeMilestone(id, repoInformation);
    console.log(`Successfully closed milestone ${milestoneName} (${id}).`);
    core.setOutput('milestone_id', id);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(
        `Milestone ${milestoneName} cannot be closed. Reason: ${error.message}`,
      );
    }
  }
}

function handleMissingMilestone(): void {
  if (core.getBooleanInput('crash_on_missing')) {
    core.setFailed('Milestone with provided name not found');
  } else {
    core.warning('Action stopped because no milestone was found');
  }
}

function getRepositoryInformation(): RepositoryInformation {
  const repoUrl =
    process.env.CLOSE_MILESTONE_REPOSITORY ?? process.env.GITHUB_REPOSITORY;
  if (!repoUrl || !repoUrl.includes('/')) {
    throw new Error(
      `Cannot determine repository owner and name because repository url does not comply with owner/repo and instead is ${repoUrl}`,
    );
  }
  const [owner, name] = repoUrl.split('/');
  return {
    owner,
    name,
  };
}

async function validateSubscription(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  let repoPrivate: boolean | undefined;

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8')) as {
      repository?: { private?: boolean };
    };
    repoPrivate = eventData?.repository?.private;
  }

  const upstream = 'Akkjon/close-milestone';
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl =
    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';

  core.info('');
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false)
    core.info('\u001b[32m✓ Free for public repositories\u001b[0m');
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  core.info('');

  if (repoPrivate === false) return;

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body: Record<string, string> = { action: action || '' };
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      { timeout: 3000 },
    );
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`,
      );
      core.error(
        `\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`,
      );
      process.exit(1);
    }
    core.info('Timeout or API not reachable. Continuing to next step.');
  }
}
