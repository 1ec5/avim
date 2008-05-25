# Copyright (c) 2007-2008 Minh Nguyen.
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

all: avim.jar

avim.jar:
	rm -rf ../build/ avim/
	
	# Create build directory.
	mkdir -p ../build/avim/
	cp -rf . ../build/avim/
	mv -f ../build/avim/chrome-build.manifest ../build/avim/chrome.manifest
	mv -f ../build/avim avim/
	
	# Remove build and source control files.
	rm -rf avim/Makefile
	rm -rf `find avim -name ".svn" -type d`
	
	# Create archives.
	mv -f avim/chrome/content/ .
	mv -f avim/chrome/locale/ .
	zip -mr avim.jar content/ locale/
	mv -f avim.jar avim/chrome/avim.jar
	zip -mr avim.xpi avim/

.PHONY: clean

clean:
	rm -rf avim.xpi avim/ ../build/