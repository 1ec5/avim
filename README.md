![](icon.png?raw=true)
AVIM for Firefox
================

AVIM is an extension for Firefox, Thunderbird, Komodo, and similar applications that functions as an input method editor for Vietnamese, allowing you to insert diacritical marks easily everywhere you can type. This extension, along with a basic [Chrome extension](https://github.com/kimkha/avim-chrome) of the same name, are based on the [avim.js script](http://sourceforge.net/projects/rhos/) by Hiếu Đặng. [Read more about AVIM for Firefox](http://avim.1ec5.org/en/).

**Important:** Firefox 57 is incompatible with AVIM due to the new [WebExtensions feature](https://support.mozilla.org/kb/firefox-add-technology-modernizing) that is replacing traditional extensions. AVIM cannot be updated to work in Firefox 57 until AVIM’s most basic functionality is possible in WebExtensions. Please subscribe to [this issue](https://github.com/1ec5/avim/issues/141) and vote for any Bugzilla bug reports mentioned there. Thank you for your understanding.

*AVIM là một phần mở rộng cung cấp bộ gõ tiếng Việt trong Firefox, Thunderbird, Komodo, và các chương trình tương tự, cho phép đặt dấu một cách dễ dàng ở bất cứ mọi nơi mà bạn có thể nhập văn bản. Phần mở rộng này, cũng như một tiện ích mở rộng cùng tên [dành cho Chrome](https://github.com/kimkha/avim-chrome), đều dựa trên [kịch bản avim.js](http://sourceforge.net/projects/rhos/) của Đặng Trần Hiếu. [Đọc thêm về AVIM cho Firefox](http://avim.1ec5.org/).*

***Quan trọng:** Firefox 57 không tương thích với AVIM vì [tính năng WebExtensions](https://support.mozilla.org/vi/kb/firefox-add-technology-modernizing) mới thay thế phần mở rộng truyền thống. AVIM không thể được cập nhật để hoạt động trong Firefox 57 cho đến khi có thể thực hiện các chức năng cơ bản của AVIM bằng WebExtensions. Xin vui lòng theo dõi [vấn đề này](https://github.com/1ec5/avim/issues/141) và bỏ phiếu cho các bản báo cáo lỗi tại Bugzilla được nhắc đến trong vấn đề đó. Chân thành cám ơn sự thông cảm của các bạn.*

Installation
------------

Visit [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/avim/?src=external-github) or [Thunderbird Add-ons](https://addons.thunderbird.net/thunderbird/addon/avim/?src=external-github) for the latest Mozilla-approved version of the extension.

*Hãy truy cập phiên bản mới nhất tại [Tiện ích Firefox](https://addons.mozilla.org/vi/firefox/addon/avim/?src=external-github) hoặc [Tiện ích Thunderbird](https://addons.thunderbird.net/vi/thunderbird/addon/avim/?src=external-github), các bản này được Mozilla chấp nhận.*

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

1. Download [last night’s build](https://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/latest-mozilla-central/): jsshell-_platform_.zip, where _platform_ is your operating system. (The latest [official release of SeaMonkey](http://ftp.mozilla.org/pub/mozilla.org/js/) is ancient but should work also.)
1. Go to the tests/ directory in your checkout of this project.
1. Run `/path/to/js -b -s test.js`.

The tests/ directory also contains corpus.js, useful for testing AVIM against a wordlist, such as those maintained by the [hunspell-vi](https://github.com/1ec5/hunspell-vi) project.

Translations
------------

AVIM’s user interface is currently available in several languages. Please help translate AVIM into additional languages at [BabelZilla Beta](http://adofex.clear.com.ua/projects/p/avim/).

*Giao diện của AVIM hiện có sẵn trong vài ngôn ngữ. Xin hãy giúp biên dịch AVIM ra thêm ngôn ngữ tại [BabelZilla Beta](http://adofex.clear.com.ua/projects/p/avim/).*

[![Translation statistics for AVIM](http://adofex.clear.com.ua/projects/p/avim/chart/image_png)](http://adofex.clear.com.ua/projects/p/avim/)

License
-------

AVIM is licensed under the [MIT license](LICENSE).

*AVIM được phát hành theo [giấy phép MIT](LICENSE).*

More information
----------------

For a detailed documentation and a feature comparison against other Vietnamese IMEs, see [AVIM’s official website](http://avim.1ec5.org/en/) and [project wiki](https://github.com/1ec5/avim/wiki).

*Xem tài liệu đầy đủ và bảng các tính năng so với các bộ gõ tiếng Việt khác tại [trang chủ AVIM](http://avim.1ec5.org/) và [wiki của dự án](https://github.com/1ec5/avim/wiki).*
