#!/bin/bash
localpath=`pwd`
echo "Running git pull on $localpath"

#stash the local changes
echo "Stashing current work"
git stash
# pull the repo of master branch from origin
echo "Running pull"
git pull $1 $2 
#add your own script here for server restart options