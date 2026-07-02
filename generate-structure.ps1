$folders = @(
"app",
"app\(auth)",
"app\(auth)\login",
"app\(auth)\register",
"app\(auth)\verify-email",

"app\(public)",
"app\(public)\hotels",
"app\(public)\booking",

"app\(dashboard)",
"app\(dashboard)\admin",
"app\(dashboard)\admin\dashboard",
"app\(dashboard)\admin\rooms",
"app\(dashboard)\admin\bookings",
"app\(dashboard)\admin\payments",
"app\(dashboard)\admin\reports",

"app\(dashboard)\receptionist",
"app\(dashboard)\receptionist\check-in",
"app\(dashboard)\receptionist\check-out",

"app\(dashboard)\housekeeping",
"app\(dashboard)\restaurant",

"app\api",
"app\api\auth",
"app\api\bookings",
"app\api\payments",
"app\api\webhooks",
"app\api\restaurant",

"components",
"components\ui",
"components\layout",
"components\booking",
"components\room",
"components\payment",
"components\restaurant",
"components\dashboard",

"lib",
"lib\supabase",
"lib\validations",

"hooks",
"stores",
"types"
)

$files = @(
"app\layout.tsx",
"app\globals.css",
"app\(public)\page.tsx",

"components\layout\Header.tsx",
"components\layout\Footer.tsx",
"components\layout\Sidebar.tsx",

"lib\supabase\client.ts",
"lib\supabase\server.ts",
"lib\supabase\middleware.ts",

"lib\utils.ts",
"lib\constants.ts",

"hooks\useAuth.ts",
"hooks\useBookings.ts",
"hooks\useRooms.ts",

"stores\authStore.ts",
"stores\bookingStore.ts",

"types\database.ts",
"types\api.ts",

"middleware.ts"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

foreach ($file in $files) {
    New-Item -ItemType File -Force -Path $file | Out-Null
}

Write-Host "Project structure created successfully!"