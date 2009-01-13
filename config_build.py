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

# Format of URL to view a project file in the public-facing Subversion
# repository, given the relative path of that file.
REPO_URL = "http://version.1ec5.org/viewvc/avim/trunk/%(path)s" \
           "?revision=%(rev)s&view=markup"

# Revision number in the Subversion repository.
REVISION = None

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
VAR_FILES = ["install.rdf", "chrome.manifest", "CHANGELOG", "LICENSE",
             path.join("content", "options.js")]

# Names of files to be preprocessed.
VAR_NAMES = ["options.properties"]

# Paths to directories that should be omitted from a release build.
DEBUG_DIRS = [path.join("content", "test"), path.join("skin", "test")]

# Dictionary mapping subdirectories of locale/ to BabelZilla-compatible locale
# codes. Locale names that are already compatible can be omitted.
LOCALE_DIRS = {"es": "es-ES", "vi": "vi-VN", "zh": "zh-TW"}

# Paths to files to which a license block will be prepended.
LICENSE_FILES = [path.join("content", "avim.js")]

# A dictionary of language-specific comment specifications in the form: (block
# start, line start, block end).
COMMENT_FORMATS = {"C": ("/*", " * ", " */"),
                   "Python": ('__license__ = """\\', None, '"""'),
                   "SGML": ("<!--", "\t", "  -->"),
                   "shell": (None, "# ", None)}

# A dictionary mapping lowercase file extensions to the comment format of the
# file's language.
EXT_COMMENTS = {"c": "C", "cpp": "C", "h": "C", "m": "C", "java": "C",
                "js": "C", "jsm": "C", "php": "C", "css": "C", "py": "Python",
                "html": "SGML", "xhtml": "SGML", "xml": "SGML", "rdf": "SGML",
                "xul": "SGML", "dtd": "SGML", "xsl": "SGML", "xslt": "SGML",
                "svg": "SGML", "mml": "SGML", "pl": "shell", "rb": "shell",
                "manifest": "shell", "properties": "shell", "sh": "shell"}

# A dictionary mapping lowercase file extensions to the beginnings of lines
# that must appear at the beginning of a file (prolog or shebang lines).
EXT_PROLOGS = {"py": "#!", "xhtml": "<?xml", "xml": "<?xml", "rdf": "<?xml",
               "xul": "<?xml", "xsl": "<?xml", "xslt": "<?xml", "svg": "<?xml",
               "mml": "<?xml", "pl": "#!", "rb": "#!", "sh": "#!"}

# Paths to the final XPI files.
XPI_FILES = ["%(package)s.xpi", "%(package)s-%(version)s.xpi"]
