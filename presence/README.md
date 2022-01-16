Yêu cầu có Node.js phiên bản trên 16.0.0 để chạy (Heroku nên giải quyết vấn đề này).

Yarn cần phải được cài đặt (yêu cầu có Node.js. Chạy `npm install -g yarn` để cài).


Set các biến môi trường sau (Bot có support `dotenv`. Có thể đặt file `.env` ở cùng folder với file `package.json` chứa các thông tin sau, nếu cần.)
```
DISCORD_TOKEN=token_của_bot

# thời gian bắt đầu & kết thúc, ở dạng hh:mm:ss
START=12:00:00
END=13:00:00

# prefix cho bot
PREFIX=%

# channel điểm danh
CHANNEL=channel_ID

# role điểm danh
ROLE=role_ID
```

Chạy `yarn` để cài các gói phụ thuộc.

Sau đó chạy `yarn start` tại folder chứa file `package.json`.
