# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_talia_new_2.3_session',
  :secret      => '10e65a1d18d445074c7d9c61ceab133cdceabf2c40f9410178093b0d992f4ce16d8d36ce7e80714ed803607252162051aa799bf406fd0e4874171f3c08d656fe'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
