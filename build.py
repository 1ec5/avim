#!/usr/bin/env python
"""AVIM build script

This module packages AVIM into an XPInstall file, for use by Firefox and other
Mozilla-based applications as an extension. Inspired by build.sh by Nickolay
Ponomarev.

This module requires Python 2.5 or above and is dependent on the following
command-line utilities: python, svn, svnversion."""

__version__ = "1.0"
__authors__ = ["Minh Nguyen <mxn@1ec5.org>"]
__license__ = """\
Copyright (c) 2008 Minh Nguyen.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE."""

from os import path
from datetime import date

# True if the script should produce a testing build; false if it should produce
# a release build.
DEBUG = False

# Version number of the avim.js release used in this build. Included in the
# extension's version string.
AVIM_VERSION = 20080728

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
ROOT_DIRS = ["defaults"]

# Paths to files to be preprocessed. These files contain placeholders that
# should be interpreted as variables.
VAR_FILES = ["install.rdf", "chrome.manifest", "CHANGELOG", "LICENSE",
             path.join("content", "options.js")]

# Paths to directories that should be omitted from a release build.
DEBUG_DIRS = [path.join("content", "test"), path.join("skin", "test")]

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
EXT_COMMENTS = {"c": "C", "cpp": "C", "h": "C", "m": "C", "java": "C", "js": "C",
                "jsm": "C", "php": "C", "css": "C", "py": "Python",
                "html": "SGML", "xhtml": "SGML", "xml": "SGML", "rdf": "SGML",
                "xul": "SGML", "dtd": "SGML", "xsl": "SGML", "xslt": "SGML",
                "svg": "SGML", "mml": "SGML", "pl": "shell", "rb": "shell",
                "manifest": "shell", "properties": "shell", "sh": "shell"}

# A dictionary mapping lowercase file extensions to the beginnings of lines
# that must appear at the beginning of a file (prolog or shebang lines).
EXT_PROLOGS = {"py": "#!", "xhtml": "<?xml", "xml": "<?xml", "rdf": "<?xml",
               "xul": "<?xml", "xsl": "<?xml", "xslt": "<?xml", "svg": "<?xml",
               "mml": "<?xml", "pl": "#!", "rb": "#!", "sh": "#!"}

import sys, subprocess, os, shutil, zipfile, re, hashlib, decimal

def print_help(version):
    """Prints help information to the command line."""
    print """\
Usage: python build.py [OPTIONS]
Package AVIM into an XPInstall file.

  -d, --debug               Produce a testing build.
  -h, --help                Display this help message.
      --use-name NAME       Override package name. Default is %(name)s.
      --use-version VERSION Override version string. Default is %(version)s.
  -v, --version             Print version information.\
""" % \
  {"name": PACKAGE_NAME, "version": version}

def clean(files=[], dirs=[], verbose=False):
    """Recursively deletes all files in the given directories, then the
       directories themselves."""
    for f in files:
        if path.exists(f):
            if verbose:
                print "\t%s" % f
            os.remove(f)
    for d in dirs:
        if verbose:
            print "\t%s%c" % (d, os.sep)
        shutil.rmtree(d, ignore_errors=True)

def list_files(root, excluded_dirs, excluded_files):
    """Returns a list of files under the given directory, excluding the given
       subdirectory and file names."""
    files = []
    for parent, dirs, leaves in os.walk(root):
        # Omit testing components from release build.
        if not DEBUG and parent in DEBUG_DIRS:
            for d in dirs:
                dirs.remove(d)
            continue
        # Mark each non-blacklisted file to be zipped up.
        files.extend([path.join(parent, name)
                      for name in leaves if name not in excluded_files])
        # Omit source control directories.
        for subdir in dirs:
            if subdir in excluded_dirs:
                dirs.remove(subdir)
    return files

def insert_license(file_path, src):
    """Inserts a language-aware license block at the top of the given source
       string, based on the file's `license' property in the Subversion
       repository."""
    # Get the file's extension.
    ext = path.splitext(file_path)[1]
    if not ext:
        return src
    ext = ext[1:].lower() # remove the period and force to lowercase

    # Get the file's language's comment and prolog format.
    try:
        block_start, line_start, block_end = COMMENT_FORMATS[EXT_COMMENTS[ext]]
    except KeyError:
        return src
    try:
        prolog_start = EXT_PROLOGS[ext]
    except KeyError:
        prolog_start = None

    # Get license block text.
    license_txt = subprocess.Popen("svn pg license %s" % file_path,
                                   stdout=subprocess.PIPE,
                                   shell=True).communicate()[0]
    license_txt = license_txt.splitlines()

    # Construct license block.
    block = []
    if block_start:
        block.append(block_start)
    if line_start:
        license_txt = [line_start + line for line in license_txt]
    block.extend(license_txt)
    if block_end:
        block.append(block_end)

    # Skip prolog lines.
    src = src.splitlines()
    if prolog_start:
        prolog = []
        while src[0].startswith(prolog_start):
            prolog.append(src.pop(0))
        prolog.extend(block)
        block = prolog

    # Prepend comment block.
    src = "\n".join(block) + "\n" + "\n".join(src)

    return src

def preprocess(src, debug=False, vals=None):
    """Returns the given source string, with variables substituted and testing
       code removed.

       Variables are of the following form:
           ${VarName}
       where "VarName" is the name of the variable.

       Testing code can be removed when debug is True: this method removes
       everything from any line that contains:
           $if{Debug}
       to any line that contains:
           $endif{}
       inclusive. Because the each of these lines are removed entirely, these
       processing instructions can be place inside of comments, to avoid errors
       when the file is parsed as code. Note that general if-test support has
       not been implemented."""
    # Remove testing code. We don't have real if-test support yet.
    if not DEBUG:
        debug_re = re.compile(r"^[^\r\n]*\$if\{Debug\}.*?\$endif\{\}[^\r\n]*$",
                             re.M | re.S)
        src = debug_re.sub(r"", src)

    # Substitute variables.
    for k, v in vals.iteritems():
        src = src.replace("${%s}" % k, str(v))

    return src

def local_to_jar(src, package_name):
    """Substitute local paths with JAR paths (for chrome.manifest)."""
    jar_re = re.compile(r"^((?:content|override|(?:skin|locale)\s+\S+)\s+\S+\s+"
                        r")(\S+/.*)", re.M)
    src = jar_re.sub("\\1jar:chrome/%s.jar!/\\2" % package_name, src)
    return src

def main():
    global DEBUG
    
    # Defaults
    config_file = None
    package_name = PACKAGE_NAME
    revision = REVISION or subprocess.Popen("svnversion -n",
                                            stdout=subprocess.PIPE,
                                            shell=True).communicate()[0]
    version = "%i.%s" % (AVIM_VERSION, revision) if AVIM_VERSION else revision
    today = (DATE or date.today()).strftime("%A, %B %e, %Y")
    year = date.today().year
    
    # Read arguments from command line.
    override_file = override_name = override_version = False
    for arg in sys.argv[1:]:
##        # Read configuration from file.
##        if arg in ["-f", "--config-file"]:
##            override_file = True
##            continue
##        if override_file:
##            override_file = False
##            config_file = FILE
##            continue

        # Produce a testing build.
        if arg in ["-d", "--debug"]:
            DEBUG = True
            continue

        # Use a different package name.
        if arg in ["--use-name"]:
            override_name = True
            continue
        if override_name:
            override_name = False
            package_name = arg
            continue

        # Use a different version.
        if arg in ["--use-version"]:
            override_version = True
            continue
        if override_version:
            override_version = False
            version = arg
            continue

        # Print version information.
        if arg in ["-v", "--version"]:
            print "AVIM build script %s" % __version__
            return

        # Unsupported flag.
        if arg not in ["-h", "--help"]:
            print "Invalid option '%s'." % arg

        # Print usage information.
        print_help("%i.%s" % (AVIM_VERSION, revision))
        return

    # Directories
    tmp_dir = "build"
    chrome_dir = path.join(tmp_dir, "chrome")
    omit_dirs = [".svn", "CVS"]

    # Files
    jar_path = path.join(chrome_dir, "%s.jar" % package_name)
    xpi_paths = ["%s.xpi" % package_name,
                 "%s-%s.xpi" % (package_name, version)]
    root_files = ROOT_FILES.extend(["install.rdf", "chrome.manifest"])
    omit_files = [".DS_Store", "Thumbs.db"]

    # Remove any leftovers from previous build.
    print "Removing leftovers from previous build..."
    clean(["%s.xpi" % package_name], [tmp_dir], verbose=True)

    # Create JAR directory.
    os.makedirs(chrome_dir)
    print "Generating chrome JAR file at %s..." % jar_path

    # Include each chrome-providing directory, except for any source control
    # subdirectories.
    jar_files = []
    for d in CHROME_PROVIDERS:
        jar_files.extend(list_files(d, omit_dirs, omit_files))
    for f in jar_files:
        print "\t%s" % f

    # Archive and compress chrome.
    jar = zipfile.ZipFile(jar_path, "w", zipfile.ZIP_DEFLATED)
    print "Preprocessing files..."
    for f in jar_files:
        src_file = file(f, "r")
        src = src_file.read()
        # Prepend license block.
        if f in LICENSE_FILES:
            src = insert_license(f, src)
        # Preprocess the file.
        if f in VAR_FILES:
            print "\t%s" % f
            src = preprocess(src, vals={"Rev": revision, "Version": version,
                                        "Date": today, "Year": year})
        src_file.close()
        jar.writestr(f, src)
    jar.close()

    # Include uncompressed files and directories.
    xpi_files = []
    print "Generating XPI files at %s..." % xpi_paths
    for d in ROOT_DIRS:
        xpi_files.extend(list_files(d, omit_dirs, omit_files))
    xpi_files.extend(ROOT_FILES)
    jar_path_xpi = path.join("chrome", "%s.jar" % package_name)
    print "\t%s" % jar_path_xpi
    for f in xpi_files:
        print "\t%s" % f

    # Archive and compress everything.
    xpi = zipfile.ZipFile(xpi_paths[0], "w", zipfile.ZIP_DEFLATED)
    xpi.write(jar_path, jar_path_xpi)
    print "Preprocessing files..."
    for f in xpi_files:
        src_file = file(f, "r")
        src = src_file.read()
        # Prepend license block.
        if f in LICENSE_FILES:
            src = insert_license(f, src)
        # Preprocess the file.
        if f in VAR_FILES:
            print "\t%s" % f
            src = preprocess(src, vals={"Rev": revision, "Version": version,
                                        "Date": today, "Year": year})
        if path.basename(f) == "chrome.manifest":
            src = local_to_jar(src, package_name)
        src_file.close()
        xpi.writestr(f, src)
    xpi.close()
    for f in xpi_paths[1:]:
        shutil.copy2(xpi_paths[0], f)

    # Clean up.
    print "Cleaning up..."
    clean(dirs=[tmp_dir], verbose=True)

    # Print results.
    print "Build results:"
    size = path.getsize(xpi_paths[0])
    size_kb = decimal.Decimal(size) / decimal.Decimal(1024)
    sha = hashlib.sha512()
    xpi = file(xpi_paths[0], "rb")
    sha.update(xpi.read())
    xpi.close()
    props = [("Configuration", "Debug" if DEBUG else "Release"),
             ("Version", "%s (r%s)" % (version, revision)),
             ("Date", today),
             ("Size", "%i B (%s kB)" % (size, size_kb)),
             ("SHA-512 hash", sha.hexdigest())]
    max_k_len = max([len(prop[0]) for prop in props]) + 1
    for prop in props:
        print "\t%s:%s%s" % (prop[0], " " * (max_k_len - len(prop[0])), prop[1])

if __name__ == "__main__":
    main()
