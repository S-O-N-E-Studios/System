# SonarCloud Setup

## Configuration

- **Organization:** s-o-n-e-studios
- **Project Key:** S-O-N-E-Studios_System

## GitHub Actions

Analysis runs automatically on:

- Push to `main`
- Pull requests (opened, synchronize, reopened)

## GitHub Secret

Add `SONAR_TOKEN` in the repository secrets (Settings → Secrets and variables → Actions). Generate the token at https://sonarcloud.io/account/security.

## View Results

https://sonarcloud.io/project/overview?id=S-O-N-E-Studios_System
