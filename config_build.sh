#!/bin/bash
# Build config for build.sh
APP_NAME=avim
CHROME_PROVIDERS="content locale skin"
CLEAN_UP=1
ROOT_FILES="CHANGELOG LICENSE"
ROOT_DIRS="defaults"
VAR_FILES="install.rdf CHANGELOG LICENSE content/options.js"
REV_NUM=`svnversion -n | cat`
REV_DATE=`date -u '+%A, %B %e, %Y'`
REV_YEAR=`date -u '+%Y'`
VERSION="20080728.$REV_NUM"
#"*CVS*"
PRUNE_DIRS="*.svn*"
BEFORE_BUILD=
AFTER_BUILD=
