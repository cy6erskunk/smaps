# Smaps

small web apps co-created with LLMs

## github pages deployments

Simple client-side applications are deployed from the `html/` folder as gihub pages

## ragnaduck

A mobile-friendly three.js game in `html/ragnaduck/`: a viking survives waves of giant brain-eating ducks. Combo chains, runes between waves, power-ups and an Elder Drake boss every fifth wave. Touch controls on phones; WASD, Space, E, Shift and Q on a keyboard.

## gemini-api-tool

A tool a submit request to Gemini 1.5 API together with an image that is provided as an URL. 

### Local development

Serve the folder with a web server, e.g., `npx serve`, `python -m http.server 3000`.

## cors-proxy

A basic CORS proxy that pipes response from an url provided as get parameter `url`,
adding `'Access-Control-Allow-Origin': '*'` header.