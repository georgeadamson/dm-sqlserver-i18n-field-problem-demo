class Foobars < Application
  # provides :xml, :yaml, :js

  def index
    @foobars = Foobar.all
    display @foobars
  end

  def show(id)
    @foobar = Foobar.get(id)
    raise NotFound unless @foobar
    display @foobar
  end

  def new
    only_provides :html
    @foobar = Foobar.new
    display @foobar
  end

  def edit(id)
    only_provides :html
    @foobar = Foobar.get(id)
    raise NotFound unless @foobar
    display @foobar
  end

  def create(foobar)
    @foobar = Foobar.new(foobar)
    if @foobar.save
      redirect resource(:foobars), :message => {:notice => "Foobar was successfully created"}
    else
      message[:error] = "Foobar failed to be created"
      render :new
    end
  end

  def update(id, foobar)
    @foobar = Foobar.get(id)
    raise NotFound unless @foobar
    if @foobar.update(foobar)
       redirect resource(@foobar), :message => {:notice => "Foobar was successfully updated"}
    else
      message[:error] = "Foobar failed to be updated"
      display @foobar, :edit
    end
  end

  def destroy(id)
    @foobar = Foobar.get(id)
    raise NotFound unless @foobar
    if @foobar.destroy
      redirect resource(:foobars), :message => {:notice => "Foobar was successfully deleted"}
    else
      raise InternalServerError
    end
  end

end # Foobars
