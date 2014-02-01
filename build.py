#!/usr/bin/env python
"""AVIM build script

This module packages AVIM into an XPInstall file, for use by Firefox and other
Mozilla-based applications as an extension. Inspired by build.sh by Nickolay
Ponomarev.

This module requires Python 2.5 or above and is dependent on the following
command-line utilities: python, git. It takes its configuration from
config_build.py in the same directory as itself."""

__version__ = "2.2"
__authors__ = ["Minh Nguyen <mxn@1ec5.org>"]
__license__ = """\
Copyright (c) 2008-2010 Minh Nguyen.

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

BLOB = None

class BuildConfig:
    """An enumeration of build configurations."""
    RELEASE = "Release"
    AMO = "Mozilla Add-ons"
    DEBUG = "Debug"
    L10N = "BabelZilla"
    SB = "Songbird Add-ons"
    
    @staticmethod
    def includes_test_suite(config):
        return config in [BuildConfig.DEBUG, BuildConfig.L10N]
    
    @staticmethod
    def is_releasable(config):
        return config in [BuildConfig.RELEASE, BuildConfig.AMO, BuildConfig.SB]
    
    @staticmethod
    def is_minified(config):
        return config in [BuildConfig.RELEASE, BuildConfig.SB]

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
      --babelzilla          Produce a BabelZilla-compatible build with
                                documentation for localizers. The package will
                                be significantly larger.
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
        if not BuildConfig.includes_test_suite(CONFIG) and parent in DEBUG_DIRS:
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
    if not BuildConfig.includes_test_suite(CONFIG):
        debug_re = re.compile(r"^[^\r\n]*\$if\{" + BuildConfig.DEBUG +
                              r"\}.*?\$endif\{\}[^\r\n]*$", re.M | re.S)
        src = debug_re.sub(r"", src)
    if CONFIG is BuildConfig.L10N:
        l10n_re = re.compile(r"^[^\r\n]*\$unless\{" + BuildConfig.L10N +
                             r"\}.*?\$endunless\{\}[^\r\n]*$", re.M | re.S)
        src = l10n_re.sub(r"", src)

    # Substitute variables.
    for k, v in vals.iteritems():
        src = src.replace("${%s}" % k, str(v))

    return src

def get_repo_url(file_path):
    """Returns the URL of the file in ViewVC."""
    try:
        return REPO_URL % {
            "path": file_path,
            "rev": BLOB or "master",
        }
    except (ValueError, TypeError):
        return REPO_URL % {"path": file_path, "rev": ""}

def minify_properties(src):
    """Returns a minified version of the given properties file source."""
    min_re = re.compile(r"(^|[^\\](?:\\\\)*)#.*$", re.M)
    src = min_re.sub(r"\1", src)
    src = re.sub(r"\n+", r"\n", src)
    return src

def minify_manifest(src):
    """Returns a minified version of the given chrome manifest source."""
    return re.sub(r"[\t ]+", r"\t", minify_properties(src))

def minify_xml(file_path, src):
    """Returns a minified version of the given XML source string."""
    src = "".join(ln.strip() for ln in src.split("\n"))
    src = re.sub(r"<!--.*?-->", "", src)
    url = get_repo_url(file_path)
    if url:
        msg = "<!-- Minified: see %s -->" % (url)
        src = re.sub(r"(<\?xml\s.*?\?>)", r"\1" + msg, src)
    return src

def minify_js(file_path, src):
    """Returns a minified version of the given JavaScript source string."""
    in_str = StringIO(src)
    out_str = StringIO()
    JavascriptMinify().minify(in_str, out_str)
    url = get_repo_url(file_path)
    if url:
        src = "// Minified using JSMin: see %s\n%s" % (url, out_str.getvalue())
    else:
        src = out_str.getvalue()
    in_str.close()
    out_str.close()
    return src

def l10n_main_locale_equiv(file_path):
    """Changes the given file path to point to the equivalent file for the main
       locale (i.e., en-US)."""
    locale_dir = "locale" + os.sep
    if CONFIG != BuildConfig.L10N or not file_path.startswith(locale_dir):
        return ""
    
    # Winnow the file path down to the language.
    locale = file_path[len(locale_dir):]
    rhs_idx = locale.find(os.sep)
    locale, rhs = locale[:rhs_idx], locale[rhs_idx:]
    if locale == MAIN_LOCALE:
        return ""
    
    # Attempt to replace the locale.
    try:
        return locale_dir + MAIN_LOCALE + rhs
    except KeyError:
        return file_path

def l10n_main_locale_docs(file_path):
    """Returns a dictionary mapping strings to their documentation comments for
       the .dtd or .properties file at the given path."""
    doc_file_path = l10n_main_locale_equiv(file_path)
    if not doc_file_path:
        return {}
    
    # Figure out how comment lines and string lines begin for this file.
    comment_re = string_re = None
    file_ext = path.splitext(file_path)[1]
    if file_ext == ".dtd":
        comment_re = re.compile(r"<!--\s*(?P<comment>.+?)\s*-->")
        # Assuming the string is delimited by quotation marks, not apostrophes.
        string_re = re.compile(r"<!ENTITY\s+(?P<id>\S+)\s+"
                               r"\"(?P<string>.+?)\"\s*>")
    elif file_ext == ".properties":
        comment_re = re.compile(r"^#\s*(?P<comment>.+?)")
        string_re = re.compile(r"(?P<id>.+?)=(?P<string>.+)")
    else:
        return {}
    
    # Read the main locale's equivalent file.
    doc_file = file(doc_file_path, "r")
    lines = doc_file.readlines()
    doc_file.close()
    
    # Parse the file for string documentation.
    docs = {}
    doc = ""
    for i, line in enumerate(lines):
        comment_m = comment_re.match(line)
        string_m = string_re.match(line)
        if comment_m and comment_m.group("comment"):
            doc = comment_m.group("comment")
        elif string_m and string_m.group("id") and doc:
            docs[string_m.group("id")] = doc
            doc = ""
    
    return docs

def l10n_insert_docs(file_path, src):
    """Inserts string documentation into the localization file at the given
       path with the given DTD or .properties source."""
    if CONFIG != BuildConfig.L10N:
        return None
    docs = l10n_main_locale_docs(file_path)
    if not docs:
        return None
    
    # Figure out how comment lines and string lines begin for this file.
    comment_format = string_re = None
    file_ext = path.splitext(file_path)[1]
    if file_ext == ".dtd":
        comment_format = "<!-- %s -->"
        # Assuming the string is delimited by quotation marks, not apostrophes.
        string_re = re.compile(r"<!ENTITY\s+(?P<id>\S+)\s+"
                               r"\"(?P<string>.*?)\"\s*>")
    elif file_ext == ".properties":
        comment_format = "# %s"
        string_re = re.compile(r"(?P<id>.+?)=(?P<string>.*)")
    else:
        return None
    
    doc_src = ""
    for line in src.split("\n"):
        m = string_re.match(line)
        # Remove untranslated strings so BabelZilla marks them as untranslated.
        if m and not m.group("string"):
            continue
        # Add the documentation comment.
        id = m and m.group("id")
        if m and id and docs.get(id):
            doc_src += comment_format % docs[id] + "\n"
        # Add the string itself.
        doc_src += line + "\n"
    
    return doc_src

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
    jar_re = re.compile(r"^((?:content|(?:skin|locale)\s+\S+)\s+\S+\s+)"
                        r"(\S+/.*)", re.M)
    src = jar_re.sub("\\1jar:chrome/%s.jar!/\\2" % package_name, src)
    return src

def main():
    global CONFIG, BLOB
    
    blob = subprocess.Popen("git show --abbrev-commit",
                            stdout=subprocess.PIPE,
                            shell=True).communicate()[0]
    blob = blob and re.match(r"^commit ([\w]+)$", blob, re.M)
    BLOB = blob and blob.group(1)
    
    # Defaults
##    config_file = None
    package_name = PACKAGE_NAME
    revision = REVISION
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
        if arg.startswith("-"):
            if arg not in ["-h", "--help"]:
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
    omit_dirs = [".git", ".svn", "CVS"]

    # Files
    jar_path = path.join(chrome_dir, "%s.jar" % package_name)
    root_files = ROOT_FILES.extend(["install.rdf", "chrome.manifest"])
    omit_files = [".DS_Store", "Thumbs.db", ".gitattributes", ".gitignore"]
    if CONFIG is not BuildConfig.L10N:
        omit_files.extend(L10N_FILES)
    xml_ext_re = r".*\.(?:xml|xul|xbl|dtd|rdf|svg|mml|x?html|css)$"

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
        src_file.close()
        # Preprocess the file.
        if f in VAR_FILES or path.basename(f) in VAR_NAMES:
            print "\t%s" % f
            src = preprocess(src, vals={"Rev": revision, "Version": version,
                                        "Date": today, "Year": year})
        # Add documentation for BabelZilla localizers.
        if f.endswith(".dtd") or f.endswith(".properties"):
            doc_src = l10n_insert_docs(f, src)
            if doc_src:
                src = doc_src
                print "\t%s (documentation)" % f
        # Move locale files to BabelZilla-compatible locations.
        f = l10n_compat_locale(f)
        # Minify files
        if BuildConfig.is_minified(CONFIG):
            if re.match(xml_ext_re, f, flags=re.I):
                src = minify_xml(f, src)
            elif f.endswith(".properties"):
                src = minify_properties(src)
            elif f.endswith(".js"):
                src = minify_js(f, src)
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
        src_file.close()
        # Preprocess the file.
        if f in VAR_FILES or path.basename(f) in VAR_NAMES:
            print "\t%s" % f
            src = preprocess(src, vals={"Rev": revision, "Version": version,
                                        "Date": today, "Year": year})
        if path.basename(f) == "install.rdf":
            src = l10n_compat_install(src)
        elif path.basename(f) == "chrome.manifest":
            src = minify_manifest(src)
            src = l10n_compat_manifest(src)
            src = local_to_jar(src, package_name)
        # Minify files
        if BuildConfig.is_minified(CONFIG):
            if re.match(xml_ext_re, f, flags=re.I):
                src = minify_xml(f, src)
            elif f.endswith(".js"):
                src = minify_js(f, src)
        if CONFIG == BuildConfig.SB:
            info = zipfile.ZipInfo(f)
            info.external_attr = (0660 << 16L) | (010 << 28L)
            xpi.writestr(info, src)
        else:
            xpi.writestr(f, src)
    r_size = sum(f_info.file_size for f_info in xpi.infolist())
    r_size_kb = r_size / 1024.0
    xpi.close()
    for f in xpi_paths[1:]:
        shutil.copy2(xpi_paths[0], f)

    # Clean up.
    print "Cleaning up..."
    clean(dirs=[tmp_dir], verbose=True)
    
    # Print results.
    print "Build results:"
    size = path.getsize(xpi_paths[0])
    size_kb = size / 1024.0
    sha = hashlib.sha512()
    xpi = file(xpi_paths[0], "rb")
    sha.update(xpi.read())
    xpi.close()
    props = [("Configuration", CONFIG),
             ("Version", "%s (commit %s)" % (version, BLOB)),
             ("Date", today),
             ("Size compressed", "%i B (%.1f kB)" % (size, size_kb)),
             ("Size uncompressed", "%i B (%.1f kB)" % (r_size, r_size_kb)),
             ("SHA-512 hash", sha.hexdigest())]
    max_k_len = max([len(prop[0]) for prop in props]) + 1
    for prop in props:
        print "\t%s:%s%s" % (prop[0], " " * (max_k_len - len(prop[0])), prop[1])

if __name__ == "__main__":
    main()
