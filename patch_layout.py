with open("src/app/layout.tsx", "r") as f:
    content = f.read()

if "import TrafficTracker from" not in content:
    content = content.replace('import { Toaster } from "@/components/ui/toaster";',
        'import { Toaster } from "@/components/ui/toaster";\nimport TrafficTracker from "@/components/TrafficTracker";')
    content = content.replace('</body>',
        '  <TrafficTracker />\n      </body>')

with open("src/app/layout.tsx", "w") as f:
    f.write(content)
