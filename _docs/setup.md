```sh
ssh hsn

# docker
admin@NAS:~$ cd /volume1/docker/backends/jnj-auth
admin@NAS:/volume1/docker/backends/jnj-auth$ docker-compose up -d --build
```


## check

```
http://localhost:4001/graphql
```

mutation {
  login(input: {
    email: "admin@example.com",
    password: "Password123!",
    site_domain: "localhost:4000",
    page_path: "/login"
  }) {
    token
    refresh_token
    user {
      id
      email
      first_name
      last_name
    }
    
  }
}

{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YTY4ZjY1YS03MGI1LTQyOTAtYTEzZS03OWI0ZmM1ZTk1OGIiLCJpYXQiOjE3NDM5Mzc4MjEsImV4cCI6MTc0NDAyNDIyMX0.Zn2408Zc0vxEQX1tdKg0QnLUk46DFFi4pYbU-Xl8_5M",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YTY4ZjY1YS03MGI1LTQyOTAtYTEzZS03OWI0ZmM1ZTk1OGIiLCJpYXQiOjE3NDM5Mzc4MjEsImV4cCI6MTc0NjUyOTgyMX0.CyYSR-3lhgSZIgadf8asne__WEiHtZMeOCWduYrxXHo",
      "user": {
        "id": "7a68f65a-70b5-4290-a13e-79b4fc5e958b",
        "email": "admin@example.com",
        "first_name": "관리자",
        "last_name": "김"
      }
    }
  }
}