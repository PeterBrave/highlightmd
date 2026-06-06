#!/usr/bin/env node
import http from 'node:http'

const PROXY_HOST = '127.0.0.1'
const PROXY_PORT = Number(process.env.OLLAMA_CORS_PROXY_PORT || 11435)
const TARGET = (process.env.OLLAMA_TARGET || 'http://127.0.0.1:11434').replace(/\/+$/, '')

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'Authorization, Content-Type, User-Agent, Accept, X-Requested-With',
  )
  res.setHeader('Access-Control-Max-Age', '86400')
}

const server = http.createServer((req, res) => {
  applyCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const targetUrl = new URL(req.url || '/', `${TARGET}/`)

  const proxyReq = http.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
      },
    },
    (proxyRes) => {
      const headers = { ...proxyRes.headers }
      delete headers['access-control-allow-origin']
      delete headers['access-control-allow-headers']
      delete headers['access-control-allow-methods']
      res.writeHead(proxyRes.statusCode || 502, headers)
      proxyRes.pipe(res)
    },
  )

  proxyReq.on('error', (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    }
    res.end(`Ollama proxy error: ${error.message}`)
  })

  req.pipe(proxyReq)
})

server.listen(PROXY_PORT, PROXY_HOST, () => {
  console.log(`Ollama CORS proxy: http://${PROXY_HOST}:${PROXY_PORT} -> ${TARGET}`)
  console.log('Keep this running while using the hosted web app with local Ollama.')
})
