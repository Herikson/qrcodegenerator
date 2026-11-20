# qrcodegenerator
gerador de qr code

## Funcionalidades

- Gera QR code a partir de texto/URL (tamanho, margem e nível de correção de erro configuráveis)
- Baixa como PNG ou copia a imagem para a área de transferência
- **Lê QR code de uma imagem**: clique, arraste e solte ou cole (Ctrl+V) uma imagem — o conteúdo é carregado no campo de texto para ser editado e gerado novamente

Bibliotecas (via CDN, requer internet): [qrcode](https://www.npmjs.com/package/qrcode) para gerar e [jsQR](https://www.npmjs.com/package/jsqr) para ler.

## How to Run

You can run this project using the following command:

```bash
npx --yes serve -l 5173
```

Alternative commands:
```bash
npx serve -l 5173
# or
npx --yes http-server -p 5173 -c-1
```

