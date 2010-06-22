# This file is auto-generated from the current state of the database. Instead of editing this file, 
# please use the migrations feature of Active Record to incrementally modify your database, and
# then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your database schema. If you need
# to create the application database on another system, you should be using db:schema:load, not running
# all the migrations from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20100118154130) do

  create_table "active_sources", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "uri",        :null => false
    t.string   "type"
  end

  add_index "active_sources", ["uri"], :name => "index_active_sources_on_uri", :unique => true

  create_table "custom_templates", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "name",          :null => false
    t.string   "template_type", :null => false
    t.text     "content",       :null => false
  end

  add_index "custom_templates", ["name"], :name => "index_custom_templates_on_name", :unique => true

  create_table "data_records", :force => true do |t|
    t.string  "type"
    t.string  "location",  :null => false
    t.string  "mime"
    t.integer "source_id", :null => false
  end

  add_index "data_records", ["source_id"], :name => "index_data_records_on_source_id"

  create_table "progress_jobs", :force => true do |t|
    t.integer  "job_id"
    t.integer  "processed_count",  :null => false
    t.integer  "item_count",       :null => false
    t.datetime "started_at"
    t.string   "progress_message"
  end

  add_index "progress_jobs", ["job_id"], :name => "index_progress_jobs_on_job_id", :unique => true

  create_table "semantic_properties", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "value",      :null => false
  end

  create_table "semantic_relations", :force => true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "object_id",     :null => false
    t.string   "object_type",   :null => false
    t.integer  "subject_id",    :null => false
    t.string   "predicate_uri", :null => false
    t.integer  "rel_order"
    t.string   "value"
  end

  add_index "semantic_relations", ["predicate_uri"], :name => "index_semantic_relations_on_predicate_uri"

  create_table "users", :force => true do |t|
    t.string   "crypted_password",          :limit => 40
    t.string   "salt",                      :limit => 40
    t.string   "remember_token"
    t.datetime "remember_token_expires_at"
    t.string   "name"
    t.string   "email_address"
    t.boolean  "administrator",                           :default => false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "state",                                   :default => "active"
    t.datetime "key_timestamp"
  end

  add_index "users", ["state"], :name => "index_users_on_state"

  create_table "workflows", :force => true do |t|
    t.string  "state",     :null => false
    t.string  "arguments", :null => false
    t.string  "type"
    t.integer "source_id", :null => false
  end

  add_index "workflows", ["source_id"], :name => "index_workflows_on_source_id", :unique => true

end
