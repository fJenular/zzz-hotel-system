import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
    process.exit(1)
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// User data sesuai PRD - 7 roles
const users = [
    {
        email: 'superadmin@zzzhotel.com',
        password: 'SuperAdmin123!',
        full_name: 'Super Administrator',
        phone: '081234567890',
        role: 'super_admin',
        email_verified: true
    },
    {
        email: 'admin@zzzhotel.com',
        password: 'Admin123!',
        full_name: 'Hotel Administrator',
        phone: '081234567891',
        role: 'admin',
        email_verified: true
    },
    {
        email: 'manager@zzzhotel.com',
        password: 'Manager123!',
        full_name: 'Hotel Manager',
        phone: '081234567892',
        role: 'manager',
        email_verified: true
    },
    {
        email: 'receptionist@zzzhotel.com',
        password: 'Reception123!',
        full_name: 'Front Desk Receptionist',
        phone: '081234567893',
        role: 'receptionist',
        email_verified: true
    },
    {
        email: 'reststaff@zzzhotel.com',
        password: 'RestStaff123!',
        full_name: 'Restaurant Staff',
        phone: '081234567894',
        role: 'rest_staff',
        email_verified: true
    },
    {
        email: 'housekeeping@zzzhotel.com',
        password: 'Housekeep123!',
        full_name: 'Housekeeping Staff',
        phone: '081234567895',
        role: 'housekeeping',
        email_verified: true
    },
    {
        email: 'guest@example.com',
        password: 'Guest123!',
        full_name: 'John Doe (Guest)',
        phone: '081234567896',
        role: 'guest',
        email_verified: true
    },
    {
        email: 'guest2@example.com',
        password: 'Guest123!',
        full_name: 'Jane Smith (Guest)',
        phone: '081234567897',
        role: 'guest',
        email_verified: true
    }
]

async function seedUsers() {
    console.log('👥 Seeding Users with Different Roles...\n')
    console.log('📋 Creating users based on PRD roles:\n')

    const createdUsers = []
    const failedUsers = []

    for (const userData of users) {
        console.log(`\n${'='.repeat(60)}`)
        console.log(`Creating user: ${userData.email}`)
        console.log(`${'='.repeat(60)}`)

        try {
            // Check if user already exists
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingUsers?.users.find(u => u.email === userData.email)

            if (existingUser) {
                console.log(`⚠️  User already exists: ${userData.email}`)
                console.log(`   User ID: ${existingUser.id}`)

                // Update user role in users table
                const { error: updateError } = await supabaseAdmin
                    .from('users')
                    .update({
                        role: userData.role,
                        full_name: userData.full_name,
                        phone: userData.phone,
                        email_verified: userData.email_verified
                    })
                    .eq('id', existingUser.id)

                if (updateError) {
                    console.error(`❌ Failed to update user role:`, updateError.message)
                } else {
                    console.log(`✅ Updated user role to: ${userData.role}`)
                }

                createdUsers.push({
                    email: userData.email,
                    role: userData.role,
                    status: 'updated'
                })
                continue
            }

            // Create new user with Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: userData.email_verified,
                user_metadata: {
                    full_name: userData.full_name,
                    phone: userData.phone
                }
            })

            if (authError) {
                console.error(`❌ Auth creation failed:`, authError.message)
                failedUsers.push({
                    email: userData.email,
                    error: authError.message
                })
                continue
            }

            console.log(`✅ Auth user created: ${authData.user.id}`)

            // Create user record in users table
            const { error: userError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    phone: userData.phone,
                    role: userData.role,
                    email_verified: userData.email_verified
                })

            if (userError) {
                console.error(`❌ User table insert failed:`, userError.message)

                // Cleanup: delete auth user if table insert failed
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

                failedUsers.push({
                    email: userData.email,
                    error: userError.message
                })
                continue
            }

            console.log(`✅ User record created in users table`)
            console.log(`   Role: ${userData.role}`)
            console.log(`   Status: ${userData.email_verified ? 'Verified' : 'Pending'}`)

            createdUsers.push({
                email: userData.email,
                password: userData.password,
                role: userData.role,
                status: 'created'
            })

        } catch (error: any) {
            console.error(`❌ Unexpected error:`, error.message)
            failedUsers.push({
                email: userData.email,
                error: error.message
            })
        }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`)
    console.log('📊 SEEDING SUMMARY')
    console.log('='.repeat(60))
    console.log(`\n✅ Successfully created/updated: ${createdUsers.length} users`)
    console.log(`❌ Failed: ${failedUsers.length} users\n`)

    if (createdUsers.length > 0) {
        console.log('📝 CREATED USERS:')
        console.log('─'.repeat(60))
        createdUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`)
            console.log(`   Role: ${user.role}`)
            if (user.password) {
                console.log(`   Password: ${user.password}`)
            }
            console.log(`   Status: ${user.status}`)
            console.log('')
        })
    }

    if (failedUsers.length > 0) {
        console.log('\n❌ FAILED USERS:')
        console.log('─'.repeat(60))
        failedUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`)
            console.log(`   Error: ${user.error}`)
            console.log('')
        })
    }

    // Login credentials summary
    console.log('\n🔐 LOGIN CREDENTIALS SUMMARY')
    console.log('═'.repeat(60))
    console.log('\nAdmin Users:')
    console.log('─'.repeat(60))
    console.log('Email: superadmin@zzzhotel.com')
    console.log('Password: SuperAdmin123!')
    console.log('Role: super_admin (Full system access)')
    console.log('')
    console.log('Email: admin@zzzhotel.com')
    console.log('Password: Admin123!')
    console.log('Role: admin (Hotel management)')
    console.log('')
    console.log('Email: manager@zzzhotel.com')
    console.log('Password: Manager123!')
    console.log('Role: manager (Reports & analytics)')
    console.log('')
    console.log('\nStaff Users:')
    console.log('─'.repeat(60))
    console.log('Email: receptionist@zzzhotel.com')
    console.log('Password: Reception123!')
    console.log('Role: receptionist (Front desk operations)')
    console.log('')
    console.log('Email: reststaff@zzzhotel.com')
    console.log('Password: RestStaff123!')
    console.log('Role: rest_staff (Restaurant operations)')
    console.log('')
    console.log('Email: housekeeping@zzzhotel.com')
    console.log('Password: Housekeep123!')
    console.log('Role: housekeeping (Room cleaning tasks)')
    console.log('')
    console.log('\nGuest Users:')
    console.log('─'.repeat(60))
    console.log('Email: guest@example.com')
    console.log('Password: Guest123!')
    console.log('Role: guest (Can make bookings)')
    console.log('')
    console.log('Email: guest2@example.com')
    console.log('Password: Guest123!')
    console.log('Role: guest (Can make bookings)')
    console.log('')

    console.log('\n🎉 User seeding completed!')
    console.log('\n💡 You can now test login with these credentials at:')
    console.log('   http://localhost:3000/login')
}

seedUsers().catch(error => {
    console.error('\n💥 Seeding failed:', error)
    console.error('Stack trace:', error.stack)
})