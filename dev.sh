#!/bin/bash
lsof -ti :3010 | xargs kill -9 2>/dev/null
rm -rf .next
npm run dev
