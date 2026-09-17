async function run() {
  const req = await fetch('http://localhost:5000/api/v1/courses');
  console.log('Courses:', await req.text());
}
run();
