#!/bin/bash

#sleep 100
forever start $(which serve) -s /home/hussein/Desktop/qaraaoun-reservoir-frontend/build -l 8000
#sudo yarn start /home/hussein/Desktop/qaraaoun-reservoir-frontend/
#I had to use:
#$ npm install forever -g
#but still running from /etc/rc.local seems to have issues related to sudo
