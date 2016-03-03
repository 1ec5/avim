![](icon.png?raw=true)
AVIM for Firefox
================

AVIM is an extension for Firefox, Thunderbird, Komodo, and similar applications that functions as an input method editor for Vietnamese, allowing you to insert diacritical marks easily everywhere you can type. This extension, along with a basic [Chrome extension](https://github.com/kimkha/avim-chrome) of the same name, are based on the [avim.js script](http://sourceforge.net/projects/rhos/) by Hiếu Đặng. [Read more about AVIM for Firefox](http://avim.1ec5.org/en/).

*AVIM là một phần mở rộng cung cấp bộ gõ tiếng Việt trong Firefox, Thunderbird, Komodo, và các chương trình tương tự, cho phép đặt dấu một cách dễ dàng ở bất cứ mọi nơi mà bạn có thể nhập văn bản. Phần mở rộng này, cũng như một tiện ích mở rộng cùng tên [dành cho Chrome](https://github.com/kimkha/avim-chrome), đều dựa trên [kịch bản avim.js](http://sourceforge.net/projects/rhos/) của Đặng Trần Hiếu. [Đọc thêm về AVIM cho Firefox](http://avim.1ec5.org/).*

Installation
------------

Visit [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/avim/?src=external-github) for the latest Mozilla-approved version of the extension.

*Hãy truy cập phiên bản mới nhất tại [Tiện ích Firefox](https://addons.mozilla.org/vi/firefox/addon/avim/?src=external-github), bản này được Mozilla chấp nhận.*

Building
--------

[![Build Status](https://travis-ci.org/1ec5/avim.svg?branch=master)](https://travis-ci.org/1ec5/avim)

To package the code as an extension yourself, you can use the included build script, which requires Python 2.7. In a command line window, navigate to the `avim/` directory and execute the following commands:

```bash
pip install -r requirements.txt
python build.py
```

Two installable archives, `avim.xpi` and `avim-VERSION.xpi`, should now reside in that directory.

*Để gói lấy mã nguồn thành phần mở rộng, bạn có thể sử dụng script xây dựng, cần Python 2.7. Trong cửa sổ dòng lệnh, hãy duyệt tới thư mục `avim/` và chạy lệnh sau:*

```bash
pip install -r requirements.txt
python build.py
```

*Hai gói cài đặt được, `avim.xpi` và `avim-PHIÊN_BẢN.xpi`, sẽ nằm trong thư mục đó. Script xây dựng có vài tùy chọn, chẳng hạn để sản xuất một phiên bản soát lỗi có bộ phận đo thử.*

Tests
-----

The test harness requires [SpiderMonkey](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey), the command line interface to the JavaScript engine in Firefox:

1. Download [last night’s Developer Edition build](https://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/latest-mozilla-aurora/): jsshell-_platform_.zip, where _platform_ is your operating system. (The latest [official release of SeaMonkey](http://ftp.mozilla.org/pub/mozilla.org/js/) is ancient but should work also.)
1. Go to the tests/ directory in your checkout of this project.
1. Run `/path/to/js -b -s test.js`.

The tests/ directory also contains corpus.js, useful for testing AVIM against a wordlist, such as those maintained by the [hunspell-vi](https://github.com/1ec5/hunspell-vi) project.

Translations
------------

AVIM’s user interface is currently available in several languages. Please help translate AVIM into additional languages at [BabelZilla Beta](http://beta.babelzilla.org/projects/p/avim/).

*Giao diện của AVIM hiện có sẵn trong vài ngôn ngữ. Xin hãy giúp biên dịch AVIM ra thêm ngôn ngữ tại [BabelZilla Beta](http://beta.babelzilla.org/projects/p/avim/).*

[![Translation statistics for AVIM](http://beta.babelzilla.org/projects/p/avim/chart/image_png)](http://beta.babelzilla.org/projects/p/avim/)

License
-------

AVIM is licensed under the [MIT license](LICENSE).

*AVIM được phát hành theo [giấy phép MIT](LICENSE).*

More information
----------------

For a detailed documentation and a feature comparison against other Vietnamese IMEs, see [AVIM’s official website](http://avim.1ec5.org/en/) and [project wiki](https://github.com/1ec5/avim/wiki).

*Xem tài liệu đầy đủ và bảng các tính năng so với các bộ gõ tiếng Việt khác tại [trang chủ AVIM](http://avim.1ec5.org/) và [wiki của dự án](https://github.com/1ec5/avim/wiki).*
