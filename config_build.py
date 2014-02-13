#!/usr/bin/env python
"""AVIM build configuration"""

from os import path
from datetime import date
from build import BuildConfig

# Type of build to produce.
CONFIG = BuildConfig.RELEASE

# Version number of the avim.js release used in this build. Included in the
# extension's version string.
AVIM_VERSION = 20080728

# Format of URL to view a project file in the public-facing Git repository,
# given the relative path of that file.
REPO_URL = "https://github.com/1ec5/avim/blob/%(rev)s/%(path)s"

# Incremented revision number, originally based on the latest Subversion
# revision.
REVISION = 523

# Build date.
DATE = None

# Name to use in the build's directories.
PACKAGE_NAME = "avim"

# Paths to directories that consitute the chrome JAR file.
CHROME_PROVIDERS = ["content", "locale", "skin"]

# Paths to miscellaneous files that should be included in the build's root
# directory. install.rdf and chrome.manifest are automatically included.
ROOT_FILES = ["LICENSE"]

# Paths to directories that should be included, uncompressed, in the build's
# root directory.
ROOT_DIRS = ["components", "defaults"]

# Paths to files to be preprocessed. These files contain placeholders that
# should be interpreted as variables.
VAR_FILES = ["install.rdf", "chrome.manifest", "LICENSE",
             path.join("content", "avim.js"),
			 path.join("content", "options.js"),
			 path.join("content", "options.xul")]

# Names of files to be preprocessed.
VAR_NAMES = ["options.dtd"]

# Paths to directories that should be omitted from a release build.
DEBUG_DIRS = [path.join("content", "test"),
			  path.join("content", "skin", "test"), path.join("skin", "test"),
			  # Unmaintained localizations
			  path.join("locale", "fr"), path.join("locale", "zh-TW")]

# Names of localization files that should be omitted from a release build.
L10N_FILES = ["amo.dtd", "install.dtd"]

# Dictionary mapping subdirectories of locale/ to BabelZilla-compatible locale
# codes. Locale names that are already compatible can be omitted.
LOCALE_DIRS = {"en": "en-US", "es": "es-ES"}

# Name of the fallback locale that is guaranteed to contain translations for all
# the extension's strings and that contains documentation for each string.
MAIN_LOCALE = "en-US"

# Paths to the final XPI files.
XPI_FILES = ["%(package)s.xpi", "%(package)s-%(version)s.xpi"]
