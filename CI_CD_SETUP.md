# React Native CI/CD Setup Guide

## Overview

This document explains the requirements, setup process, and commands needed to implement a CI/CD pipeline for a React Native application using GitHub Actions.

---

# Prerequisites

## 1. Source Code Repository

* GitHub Repository
* GitHub Actions enabled

Example:

```bash
https://github.com/your-company/your-project.git
```

---

## 2. Branch Strategy

Recommended:

```text
main      -> Production
staging   -> QA / UAT
develop   -> Development
feature/* -> New Features
```

Workflow:

```text
feature branch
      ↓
develop
      ↓
staging
      ↓
main
```

---

## 3. React Native Project Information

Required:

* React Native Version
* Android Package Name
* iOS Bundle Identifier (Optional)
* Environment Files (.env)

Example:

```text
React Native: 0.79.x
Package Name: com.company.app
```

---

# Android Requirements

## Android Keystore

Required for release builds.

Files:

```text
upload-keystore.jks
```

Required Information:

```text
Keystore File
Keystore Password
Key Alias
Key Password
```

Store these values in GitHub Secrets.

---

## Play Store Requirements

Required for automatic deployment.

Need:

* Google Play Console Access
* Service Account JSON Key
* Published Application

Example Secret:

```text
PLAY_STORE_JSON_KEY
```

---

# GitHub Secrets

Navigate to:

```text
Repository
 → Settings
 → Secrets and Variables
 → Actions
```

Add:

```text
ANDROID_KEYSTORE
ANDROID_STORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
PLAY_STORE_JSON_KEY
```

Optional:

```text
ENV_FILE
FIREBASE_CONFIG
API_KEYS
```

---

# CI/CD Flow

## Staging Branch

When code is pushed to staging:

```text
Install Dependencies
Run Lint
Run Tests
Generate Release AAB
Upload Artifact
```

Command:

```bash
git push origin staging
```

---

## Production Branch

When code is pushed to main:

```text
Install Dependencies
Run Lint
Run Tests
Build Release AAB
Deploy to Play Store Internal Testing
```

Command:

```bash
git push origin main
```

---

# GitHub Actions Workflow

Location:

```text
.github/workflows/android.yml
```

Example:

```yaml
name: Android Build

on:
  push:
    branches:
      - staging
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install

      - name: Run Lint
        run: npm run lint

      - name: Build Android
        run: |
          cd android
          chmod +x gradlew
          ./gradlew bundleRelease
```

---

# Android Build Commands

Install Packages:

```bash
npm install
```

Lint:

```bash
npm run lint
```

Run Tests:

```bash
npm test
```

Build Release Bundle:

```bash
cd android
./gradlew bundleRelease
```

Build APK:

```bash
cd android
./gradlew assembleRelease
```

---

# Build Output

AAB:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

APK:

```text
android/app/build/outputs/apk/release/app-release.apk
```

---

# Upload Build Artifact

Example:

```yaml
- name: Upload AAB
  uses: actions/upload-artifact@v4
  with:
    name: android-aab
    path: android/app/build/outputs/bundle/release/*.aab
```

---

# Fastlane Setup

Install:

```bash
gem install fastlane
```

Initialize:

```bash
cd android
fastlane init
```

Deploy Lane:

```ruby
lane :deploy do
  upload_to_play_store(
    track: 'internal'
  )
end
```

Run:

```bash
fastlane deploy
```

---

# Manual Pipeline Execution

Add:

```yaml
on:
  workflow_dispatch:
```

Then:

```text
GitHub
 → Actions
 → Select Workflow
 → Run Workflow
```

---

# Developer Workflow

## Feature Development

```bash
git checkout -b feature/login
git add .
git commit -m "Added login screen"
git push origin feature/login
```

## Merge to Staging

```bash
git checkout staging
git merge feature/login
git push origin staging
```

CI/CD automatically:

```text
Build AAB
Upload Artifact
```

## Release to Production

```bash
git checkout main
git merge staging
git push origin main
```

CI/CD automatically:

```text
Build Release AAB
Deploy to Play Store
```

---

# Required Information Before Setup

Provide the following:

1. GitHub Repository URL
2. Branch Names
3. React Native Version
4. Android Package Name
5. Play Store Application Status
6. Android Keystore
7. Google Play Service Account JSON
8. Environment Variables (.env)
9. Android Only or Android + iOS

---

# Expected Result

After setup:

```text
Developer Pushes Code
          ↓
GitHub Actions Triggered
          ↓
Lint & Tests
          ↓
Android Build
          ↓
Artifact Upload
          ↓
Play Store Deployment (Optional)
```

Only command needed by developers:

```bash
git push origin staging
```

or

```bash
git push origin main
```

The entire build and deployment process runs automatically.
