#!/bin/bash

#sleep 100
forever start $(which serve) -s /home/idrise/Desktop/qaraaoun-reservoir-frontend-local/build -l 8000

#I had to use:
#$ npm install forever -g
#but still running from /etc/rc.local seems to have issues related to sudo
