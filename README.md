# トモシゴト能システム

## トークンの取得方法
dockerを立ち上げた状態で
```
docker exec -it backend-backend-1 python tests/utils/get_test_token.py
```
をする。

したらtestユーザーでログインしたアクセストークンが生成されるため、それを使用する。
Swagger UIのAuthorizeとかで使用できる。