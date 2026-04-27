# [Nginx]Supervisord

# **About supervisor**

supervisor는 여러 프로세스를 모니터링-관리하며 데몬 형식으로 지속적으로 동작해야 하는 프로세스가 있을 경우 유용하게 사용할 수 있다

데몬은 서버(시스템)이 살아있는 동안 항상 실행되어야 하는 백그라운드 프로세스이다.

Supervisor 란?

- supervisor가 프로세스에 대해 지속적으로 모니터링 하고, 프로세스가 예기치 않게 종료되어도 재구동하며 지속적으로 동작하도록 돕는 도구이다.
- 또한 여러 프로세스들을 통합해서 관리할 수 있다는 장점도 있다.

사용자에게 지속적으로 제공해야 하는 여러개의 프로세스(서비스)가 있는데, 사람이 직접 프로세스가 구동되고 있는지 지속적으로 확인하는 것은 쉽지 않다. 이 역할을 supervisor가 하게된다.

# **supervisor 설치**

supervisor는 파이썬으로 만들어진 제품이라 python 2.7이상 또는 python3.4 이상이 필요하다.

# **supervisor 설정**

supervisor 설치가 끝나면 supervisor 관련 설정을 수정하고, 모니터링 할 프로세스를 작성해줘야 한다.

supervisor 설치가 완료되면 /etc/supervisord.conf 파일을 수정하면 된다.

없으면 원하는 경로에 작성해주면 된다.

설정 관련 문서 [http://supervisord.org/configuration.html](http://supervisord.org/configuration.html)

supervisord.conf

```
[supervisord]
nodaemon=true
user=root
logfile=/dev/stdout
logfile_maxbytes=0
pidfile=/tmp/supervisord.pid

[program:gunicorn]
directory=/app
command=/usr/local/bin/gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
autostart=true
autorestart=true
stdout_logfile=/dev/fd/1
stdout_logfile_maxbytes=0
stderr_logfile=/dev/fd/2
stderr_logfile_maxbytes=0
priority=10

[program:nginx]
command=/usr/sbin/nginx -g 'daemon off;'
autostart=true
autorestart=true
stdout_logfile=/dev/fd/1
stdout_logfile_maxbytes=0
stderr_logfile=/dev/fd/2
stderr_logfile_maxbytes=0
priority=20

[program:logrotate]
command=/bin/bash -c "while true; do /usr/sbin/logrotate /etc/logrotate.conf; sleep 86400; done"
autorestart=true

```