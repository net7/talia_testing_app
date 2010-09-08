class Admin::AdminSiteController < ApplicationController

  hobo_controller
  def my_name
    (this ? this.class : model).name.underscore
  end

  private

  def current_thing
    @current_thing ||= (self.instance_variable_get(:"@#{my_name}") || find_instance)
  end

  def current_thing=(value)
    @current_thing = value
    self.instance_variable_set(:"@#{my_name}", value)
  end

  def save_created(thing)
    thing.creatable_by?(current_user) or raise Hobo::PermissionDeniedError, "#{self.class.name}#create"
    thing.save
  end

  # Creates a source. If the creation is successful, this will redirect to the
  # sources #show action (if no block is given). If not successful, this will
  # always render the current #new action with the current source.
  #
  # If a block is given, it will be executed iff the source was successfully
  # created, instead of the default redirect.
  #
  # == Parameters
  # * [*params*] The parameters to create the source from. Uses the default value
  #              if not specified.
  # * [*class_name*] Name of the class to create the new object from
  def hobo_source_create(options = {}, &block)
    options.to_options!
    klass = options[:class_name].constantize if(options[:class_name])
    klass ||= (this ? this.class : model)
    self.current_thing = klass.new(options[:params] || attribute_parameters)
    if(save_created(current_thing))
      flash[:notice] = I18n.t("#{my_name.pluralize}.messages.create_success")
      yield_or_redirect(&block)
    else
      flash[:notice] = I18n.t("#{my_name.pluralize}.errors.create_error", :message => current_thing.errors.full_messages.join(', '))
      render :action => :new
    end
  end

  # Works like #hobo_source_create, only for updates.
  #
  # == Additional Parameters
  # * [*find_options*] Options for the finder that locates the source to update
  def hobo_source_update(options = {}, &block)
    options.to_options!
    self.current_thing = find_instance(options[:find_options] || {})
    current_thing.updatable_by?(current_user) or raise Hobo::PermissionDeniedError, "#{self.class.name}#update"
    if(current_thing.rewrite_attributes(options[:params] || attribute_parameters))
      flash[:notice] = I18n.t("#{my_name.pluralize}.messages.update_success")
      yield_or_redirect(&block)
    else
      flash[:notice] = I18n.t("#{my_name.pluralize}.errors.update_error", :message => current_thing.errors.full_messages.join(', '))
      render :action => :new
    end
  end

  def yield_or_redirect(&block)
    if(block)
      block.call(current_thing)
    else
      redirect_to :controller => my_name.pluralize, :action => :show, :id => current_thing.id
    end
  end
  
end