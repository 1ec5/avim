#!/bin/bash
# Build config for build.sh
APP_NAME=avim
CHROME_PROVIDERS="content locale skin"
CLEAN_UP=1
ROOT_FILES="LICENSE"
ROOT_DIRS="defaults"
VAR_FILES="install.rdf CHANGELOG LICENSE content/options.js"
REV_NUM=`svnversion -n | cat`
REV_DATE='Tuesday, August 26, 2008'
REV_YEAR=2008
VERSION="20080728.$REV_NUM"
#"*CVS*"
PRUNE_DIRS="*.svn*"
BEFORE_BUILD=`echo "*** WARNING ***\
build.sh is deprecated and will be removed in a future release of AVIM! Please\
use build.py instead.\
"`
AFTER_BUILD=
