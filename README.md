# Remove-milestone

A GitHub Action to remove a milestone by the milestone's name

[![GitHub release](https://img.shields.io/github/tag/step-security/close-milestone.svg)](https://gitHub.com/step-security/close-milestone/releases/)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)
![CI](https://github.com/step-security/close-milestone/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/step-security/close-milestone/actions/workflows/check-dist.yml/badge.svg)](https://github.com/step-security/close-milestone/actions/workflows/check-dist.yml)

## Inputs

### `milestone_name`

**Required** The name of the milestone, to close.

### `crash_on_missing`

If the milestone should fail if the provided milestone is missing<br> Default:
false

## Environment Variables

### `GITHUB_TOKEN`

**Required** The access token with which the Action does the authentication with
GitHub

### `CLOSE_MILESTONE_REPOSITORY`

If provided, this variable overrides the repository used to close the milestone
for. It has to be provided in the format of `<owner>/<repository name>`

## Outputs

### `milestone_id`

The ID of the milestone which has been closed.

## Explanation for usage

- The `uses` keyword specifies which action us used.
  `step-security/close-milestone` specifies which repository is used, the
  `v2.1.0` defines which version of the action is used. You can find the latest
  version in the badge at the top of the readme file. To always use the latest
  version, you can change it to `@main`, but please be aware that changes in the
  action might break your workflow.
- The `env`keyword specifies the environment variables used by and provided to
  the action. `GITHUB_TOKEN` is the secret access token to authorize to the used
  repository. Without this keyword, the action would not be able to login and
  close the milestone. It is not stored in any way or transmitted. As the code
  is open source, it would be noticed anyways.
- the `with` keyword specifies data you have to specify. Here the input
  variables are defined. These are specified [above](#inputs)

## Example minimal usage

```yaml
uses: step-security/close-milestone@v2.1.0
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  milestone_name: milestoneName
```

## Example usage with crash on missing

```yaml
uses: step-security/close-milestone@v2.1.0
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  milestone_name: milestoneName
  crash_on_missing: true
```
