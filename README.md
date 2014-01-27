AVIM for Firefox
================

[![Build Status](https://travis-ci.org/1ec5/avim.png?branch=master)](https://travis-ci.org/1ec5/avim)

AVIM is a extension for Firefox and similar applications that provides an input method editor for Vietnamese, based on Hiếu Đặng’s [webpage script](http://sourceforge.net/projects/rhos/) of the same name. Hiếu was the original developer of this extension; Minh Nguyễn has been the developer since 2007.

*AVIM là một phần mở rộng cung cấp bộ gõ tiếng Việt trong Firefox và các chương trình tương tự, dựa trên [kịch bản cùng tên](http://sourceforge.net/projects/rhos/) của Đặng Trần Hiếu. Hiếu là người đầu tiên phát triển phần mở rộng này, còn Nguyễn Xuân Minh là người phát triển phần mở rộng kể từ năm 2007.*

Installation
------------

Visit [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/avim/).

*Hãy truy cập [Tiện ích Firefox](https://addons.mozilla.org/vi/firefox/addon/avim/).*

Building
--------

To package the code as an extension yourself, you can use the included build script, which requires Python 2.5–2.7. In a command line window, navigate to the `avim/` directory and execute the following commands:

```bash
pip install -r requirements.txt
python build.py
```

Two installable archives, `avim.xpi` and `avim-VERSION.xpi`, should now reside in that directory.

*Để gói lấy mã nguồn thành phần mở rộng, bạn có thể sử dụng script xây dựng, cần Python 2.5–2.7. Trong cửa sổ dòng lệnh, hãy duyệt tới thư mục `avim/` và chạy lệnh sau:*

```bash
pip install -r requirements.txt
python build.py
```

*Hai gói cài đặt được, `avim.xpi` và `avim-PHIÊN_BẢN.xpi`, sẽ nằm trong thư mục đó. Script xây dựng có vài tùy chọn, chẳng hạn để sản xuất một phiên bản soát lỗi có bộ phận đo thử.*

License
-------

AVIM is licensed under the [MIT license](LICENSE).

*AVIM được phát hành theo [giấy phép MIT](LICENSE).*

More information
----------------

For a detailed documentation and a feature comparison against other Vietnamese IMEs, see [AVIM’s official website](http://www.1ec5.org/software/avim/).

*Xem tài liệu đầy đủ và bảng các tính năng so với các bộ gõ tiếng Việt khác tại [trang chủ AVIM](http://www.1ec5.org/software/avim/index.vi.html).*
