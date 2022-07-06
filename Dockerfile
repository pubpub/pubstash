FROM denoland/deno:debian

EXPOSE 8080

RUN apt update \
    && apt install -y nodejs npm wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt update \
    && apt install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/app

RUN npm install pagedjs
RUN npm install git+https://github.com/pubpub/pagedjs-cli#198b65ce0e3e089176c294de7a855e8da8a46a23

USER deno

COPY deps.ts .

RUN deno cache deps.ts

ADD ./ /usr/app

RUN deno cache main.ts

CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-run", "main.ts"]