import * as core from "@actions/core";
import axios, { isAxiosError } from "axios";
import { authenticate } from "./auth";
import {
  closeMilestone,
  getMilestoneId,
  getMilestones,
  RepositoryInformation,
} from "./milestones";

async function validateSubscription(): Promise<void> {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

  try {
    await axios.get(API_URL, { timeout: 3000 });
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      core.error(
        "Subscription is not valid. Reach out to support@stepsecurity.io",
      );
      process.exit(1);
    } else {
      core.info("Timeout or API not reachable. Continuing to next step.");
    }
  }
}
/**
 * Implements the main workflow.
 *
 * authenticate -> get milestones -> close milestone
 */

export async function run(): Promise<void> {
  await validateSubscription();
  const milestoneName = core.getInput("milestone_name");

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
    core.setOutput("milestone_id", id);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(
        `Milestone ${milestoneName} cannot be closed. Reason: ${error.message}`,
      );
    }
  }
}

function handleMissingMilestone(): void {
  if (core.getBooleanInput("crash_on_missing")) {
    core.setFailed("Milestone with provided name not found");
  } else {
    core.warning("Action stopped because no milestone was found");
  }
}

function getRepositoryInformation(): RepositoryInformation {
  const repoUrl =
    process.env.CLOSE_MILESTONE_REPOSITORY ?? process.env.GITHUB_REPOSITORY;
  if (!repoUrl || !repoUrl.includes("/")) {
    throw new Error(
      `Cannot determine repository owner and name because repository url does not comply with owner/repo and instead is ${repoUrl}`,
    );
  }
  const [owner, name] = repoUrl.split("/");
  return {
    owner,
    name,
  };
}
