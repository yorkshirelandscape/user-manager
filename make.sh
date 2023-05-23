#!/usr/bin/env bash
rm *.zip
zip -ur user-manager.zip module.json module packs styles templates user-manager.js
ver=`grep \"version\" module.json`
printf "\033[0;34mRemember that in order to make a release:\033[0m\n"
printf "\033[0;31m - git tag this version with the module.json version (${ver})\n"
printf " - upload the new user-manager.zip as WELL as the module.json into the github release!\n"
printf " - update the CHANGELOG.md file with this version.\033[0m\n"
