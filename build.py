#!/usr/bin/env python
"""AVIM build script

This module packages AVIM into an XPInstall file, for use by Firefox and other
Mozilla-based applications as an extension. Inspired by build.sh by Nickolay
Ponomarev.

This module requires Python 2.5 or above and is dependent on the following
command-line utilities: python, svn, svnversion. It takes its configuration from
config_build.py in the same directory as itself."""

__version__ = "2.1"
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

import sys, subprocess, os, shutil, zipfile, re, hashlib, decimal
from os import path
from datetime import date
from StringIO import StringIO
from jsmin import JavascriptMinify
from config_build import *

class BuildConfig:
    """An enumeration of build configurations."""
    RELEASE = "Release"
    AMO = "Mozilla Add-ons"
    DEBUG = "Debug"
    L10N = "BabelZilla"
    SB = "Songbird Add-ons"

def print_help(version):
    """Prints help information to the command line."""
    print """\
Usage: python build.py [OPTIONS] [PATH ...]
Package AVIM into an XPInstall file. By default, multiple copies of the file are
created using the following naming scheme:
  package.xpi
  package-version.xpi
where "package" is the package name and "version" is the version string. If file
paths are specified, the XPInstall files will be located at the specified paths,
rather than at these defaults.

Available options:
  -m, --amo                 Produce an unminified build for the Firefox Add-ons
                                site. The package will be significantly larger.
      --babelzilla          Produce a BabelZilla-compatible build.
  -d, --debug               Produce a testing build with uncompressed JavaScript
                            code.
  -h, --help                Display this help message.
      --songbird            Produce a build compatible with the Songbird Add-ons
                                site. The package will be significantly larger.
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
        if CONFIG != BuildConfig.DEBUG and parent in DEBUG_DIRS:
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

       Testing code can be removed when debug is True. This method removes
       everything from any line that contains:
           $if{Debug}
       to any line that contains:
           $endif{}
       inclusive. Similarly, it removes BabelZilla-incompatible code between:
           $unless{BabelZilla}
       and:
           $endunless{}
       
       Because the each of these lines are removed entirely, these
       processing instructions can be place inside of comments, to avoid errors
       when the file is parsed as code. Note that general if-test support has
       not been implemented."""
    # Remove testing code. We don't have real if-test support yet.
    if CONFIG in [BuildConfig.RELEASE, BuildConfig.AMO]:
        debug_re = re.compile(r"^[^\r\n]*\$if\{" + BuildConfig.DEBUG +
                              r"\}.*?\$endif\{\}[^\r\n]*$", re.M | re.S)
        src = debug_re.sub(r"", src)
    elif CONFIG is BuildConfig.L10N:
        l10n_re = re.compile(r"^[^\r\n]*\$unless\{" + BuildConfig.L10N +
                             r"\}.*?\$endunless\{\}[^\r\n]*$", re.M | re.S)
        src = l10n_re.sub(r"", src)

    # Substitute variables.
    for k, v in vals.iteritems():
        src = src.replace("${%s}" % k, str(v))

    return src

def minify_js(file_path, src):
    """Returns a minified version of the given JavaScript source string."""
    in_str = StringIO(src)
    out_str = StringIO()
    JavascriptMinify().minify(in_str, out_str)
    try:
        url = REPO_URL % {"path": file_path, "rev": str(int(REVISION))}
    except (ValueError, TypeError):
        url = REPO_URL % {"path": file_path, "rev": ""}
    if url:
        src = "// Minified using JSMin: see %s\n%s" % (url, out_str.getvalue())
    else:
        src = out_str.getvalue()
    in_str.close()
    out_str.close()
    return src

def l10n_compat_locale(file_path):
    """Changes the given file path so that BabelZilla recognizes it as pointing
       to a valid locale."""
    locale_dir = "locale" + os.sep
    if CONFIG != BuildConfig.L10N or not file_path.startswith(locale_dir):
        return file_path
    
    # Winnow the file path down to the language.
    locale = file_path[len(locale_dir):]
    rhs_idx = locale.find(os.sep)
    locale, rhs = locale[:rhs_idx], locale[rhs_idx:]
    
    # Attempt to replace the locale.
    try:
        return locale_dir + LOCALE_DIRS[locale] + rhs
    except KeyError:
        return file_path

def l10n_compat_install(src):
    """Remove <em:localized> tags and certain <em:targetApplication> tags for
       compatibility with BabelZilla."""
    if not CONFIG is BuildConfig.L10N:
        return src
    tag_re = re.compile(r"<em:localized(?:\s+[^>]*)?>.*?</em:localized>", re.S)
    src = tag_re.sub(r"", src)
    return src

def l10n_compat_sub(match):
    """Attempts to substitute the locale in a matched path to a
       BabelZilla-compatible locale."""
    try:
        return match.group(1) + LOCALE_DIRS[match.group(2)] + match.group(3)
    except KeyError:
        return match.group(0)

def l10n_compat_manifest(src):
    """Adjust file paths to reflect the effects of l10n_compat_locale()."""
    if CONFIG is BuildConfig.L10N:
        path_re = re.compile(r"^(locale\s+\S+\s+)(\S+)(\s+locale/.*?/.*)", re.M)
        src = path_re.sub(l10n_compat_sub, src)
        path_re = re.compile(r"^(locale\s+\S+\s+\S+\s+locale/)(.*?)(/.*)", re.M)
        src = path_re.sub(l10n_compat_sub, src)
    return src

def local_to_jar(src, package_name):
    """Substitute local paths with JAR paths (for chrome.manifest)."""
    jar_re = re.compile(r"^((?:content|override|(?:skin|locale)\s+\S+)\s+\S+\s+"
                        r")(\S+/.*)", re.M)
    src = jar_re.sub("\\1jar:chrome/%s.jar!/\\2" % package_name, src)
    return src

def main():
    global CONFIG
    
    # Defaults
##    config_file = None
    package_name = PACKAGE_NAME
    revision = REVISION or subprocess.Popen("svnversion -n",
                                            stdout=subprocess.PIPE,
                                            shell=True).communicate()[0]
    version = "%i.%s" % (AVIM_VERSION, revision) if AVIM_VERSION else revision
    today = (DATE or date.today()).strftime("%A, %B %e, %Y")
    year = date.today().year
    
    xpi_paths = []
    
    # Read arguments from command line.
    override_file = override_name = override_version = False
    for arg in sys.argv[1:]:
        # Produce a testing build.
        if arg in ["-d", "--debug"]:
            CONFIG = BuildConfig.DEBUG
            continue
        
        # Produce an unminified build for the Firefox Add-ons site.
        if arg in ["-m", "--amo"]:
            CONFIG = BuildConfig.AMO
            continue
        
        # Produce a BabelZilla-compatible build.
        if arg in ["--babelzilla"]:
            CONFIG = BuildConfig.L10N
            continue
        
        # Produce a build compatible with the Songbird Add-ons site.
        if arg in ["--songbird"]:
            CONFIG = BuildConfig.SB
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

        # Unsupported flag; print usage information.
        if arg[0] == "-" or arg in ["-h", "--help"]:
            print "Invalid option '%s'." % arg
            print_help("%i.%s" % (AVIM_VERSION, revision))
            return
        
        # Override output locations.
        xpi_paths.append(arg)
    
    if not xpi_paths:
        xpi_vars = {"package": package_name, "version": version}
        xpi_paths = [p % xpi_vars for p in XPI_FILES]
    
    # Directories
    tmp_dir = "build"
    chrome_dir = path.join(tmp_dir, "chrome")
    omit_dirs = [".svn", "CVS"]

    # Files
    jar_path = path.join(chrome_dir, "%s.jar" % package_name)
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
        if f in VAR_FILES or path.basename(f) in VAR_NAMES:
            print "\t%s" % f
            src = preprocess(src, vals={"Rev": revision, "Version": version,
                                        "Date": today, "Year": year})
        # Minify JavaScript files
        if CONFIG is BuildConfig.RELEASE and f.endswith(".js"):
            src = minify_js(f, src)
        # Move locale files to BabelZilla-compatible locations.
        f = l10n_compat_locale(f)
        src_file.close()
        if CONFIG == BuildConfig.SB:
            info = zipfile.ZipInfo(f)
            info.external_attr = (0660 << 16L) | (010 << 28L)
            jar.writestr(info, src)
        else:
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
        if f in VAR_FILES or path.basename(f) in VAR_NAMES:
            print "\t%s" % f
            src = preprocess(src, vals={"Rev": revision, "Version": version,
                                        "Date": today, "Year": year})
        # Minify JavaScript files
        if CONFIG is BuildConfig.RELEASE and f.endswith(".js"):
            src = minify_js(f, src)
        if path.basename(f) == "install.rdf":
            src = l10n_compat_install(src)
        elif path.basename(f) == "chrome.manifest":
            src = l10n_compat_manifest(src)
            src = local_to_jar(src, package_name)
        src_file.close()
        if CONFIG == BuildConfig.SB:
            info = zipfile.ZipInfo(f)
            info.external_attr = (0660 << 16L) | (010 << 28L)
            xpi.writestr(info, src)
        else:
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
    props = [("Configuration", CONFIG),
             ("Version", "%s (r%s)" % (version, revision)),
             ("Date", today),
             ("Size", "%i B (%s kB)" % (size, size_kb)),
             ("SHA-512 hash", sha.hexdigest())]
    max_k_len = max([len(prop[0]) for prop in props]) + 1
    for prop in props:
        print "\t%s:%s%s" % (prop[0], " " * (max_k_len - len(prop[0])), prop[1])

if __name__ == "__main__":
    main()
