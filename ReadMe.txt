
This little app demonstrates how datamapper fails to store international characters correctly on sqlserver.
(All it does is try to save and retrieve a field to a table named foobars through model named foobar.)

To run this you need to:

- Create database in SqlServer and set the connection details in the database.yml file.

- Try running the spec test with "jruby -X-C -S rake spec SPEC=spec/models/foobar_spec.rb"
  (It will fail because datamapper is not retrieving the same value that it stored)

- Try running this little sample app with "jruby -S merb" and browse to http://localhost:4000/foobars
  (Try storing text such as "Américas")
  Unless you ran the tests you'll need to manually create a table named "foobars" with id and name fields.
  (Or automigrate the table by running "Foobar.auto_migrate!" in the merb console "jruby -S merb -i")