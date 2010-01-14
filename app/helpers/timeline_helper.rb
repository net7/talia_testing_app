require 'timeline'

module TimelineHelper
  
  # Include the javscript for the simile timeline
  def timeline_includes
    render :partial => 'shared/timeline_include'
  end
  
  # Create a new timeline. Example:
  # timeline('tl',
  #   theme => 'ClassicTheme'
  #   startDate => '1900-01-01'
  #   stopDate => '2000-01-01'
  #   url => '.'
  #   bands => [{
  #     intervalUnit => 'DECADE',
  #     intervalPixels => 100,
  #     date => '1900-01-01',
  #     layout => 'original'
  #     # syncWith => 0,
  #     # highlight => true
  #   }],
  #   data => { ...timeline data... } 
  # )
  def timeline(timeline_element, options)
    raise(ArgumentError, 'Must pass an option hash here') unless(options.is_a?(Hash))
    options.to_options!
    
    data = options.delete(:data)
    options[:timelineElement] = timeline_element
    timeline = Timeline.new(:config => options, :data => data)
    render(:partial => 'shared/timeline', :object => timeline, :locals => { :element_id => timeline_element })
  end
  
end