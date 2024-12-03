# Smaps

small web apps co-created with LLMs

## gemini-api-tool

A tool a submit request to Gemini 1.5 API together with an image that is provided as an URL. 

### Local development

Serve the folder with a web server, e.g., `npx serve`, `python -m http.server 3000`.

## cors-proxy

A basic CORS proxy that pipes response from an url provided as get parameter `url`,
adding `'Access-Control-Allow-Origin': '*'` header.