active-analytics
================

Active Analytics Masters Thesis


This project is the implementation for my masters thesis.

Written for Google App Engine


To get this running locally:
- Install App Engine SDK
- Open Existing App and point to code directory
- Generate API secret and save as secret.pem from Google Analytics
- Create file key.txt in root with just the API key from Google Analytics
- Add command line arguments in App Engine Launcher:
  - appidentity_email_address={Service accounte email} --appidentity_private_key_path=C:\{path to project}\active-analytics\secret.pem
