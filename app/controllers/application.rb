class Application < Merb::Controller

  # Assume alternative layout for ajax or full page requests:
  before Proc.new{ self.class.layout( request.ajax? ? :ajax : :application) }

end