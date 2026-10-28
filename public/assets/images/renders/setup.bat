@echo off
for %%i in (*.png) do (
  if exist 4k/%%~ni.webp (
    echo skipping 4k %%i
  ) else (
    echo creating 4k %%i
    magick %%i -quality 100 4k/%%~ni.webp
  )
  if exist %%~ni.webp (
    echo skipping 512p %%i
  ) else (
    echo creating 512p %%i
    magick %%i[512x288] -quality 90 %%~ni.webp
  )
  echo deleting %%i
  del %%i
)