Merb.logger.info("Loaded STAGING Environment...")

Merb::Config.use { |c|
  c[:exception_details] = false
  c[:reload_classes]    = false
  c[:log_level]         = :debug

  c[:log_file]  = Merb.root / "log" / "usertesting.log"
  # or redirect logger using IO handle
  # c[:log_stream] = STDOUT
}
