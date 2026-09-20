import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import pool from '../config/db.js';
import { createSchema } from './schema.js';


async function query(sql, ...params) { await pool.query(sql, params); }

export async function seedDatabase() {

  console.log('🔄 Initializing database schema...');
  await createSchema();

  // Check if already seeded
  const checkUsers = await pool.query('SELECT COUNT(*) as cnt FROM users');
  const checkCourses = await pool.query('SELECT COUNT(*) as cnt FROM courses');
  if (checkUsers && checkUsers.rows[0].cnt > 0 && checkCourses && checkCourses.rows[0].cnt > 0) {
    console.log('Database already contains records. Skipping initial seeding.');
    return;
  }


  console.log('🌱 Seeding initial data for Adaptive Learning Platform...');

  
  await pool.query('TRUNCATE users CASCADE');
  await pool.query('TRUNCATE courses CASCADE');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const users = [
    {
      id: crypto.randomUUID(),
      first_name: 'Sarah',
      last_name: 'Jenkins',
      email: 'prof.sarah@mentor.com',
      password_hash: passwordHash,
      role: 'mentor',
    },
    {
      id: crypto.randomUUID(),
      first_name: 'Robert',
      last_name: 'Vance',
      email: 'dr.jenkins@faculty.com',
      password_hash: passwordHash,
      role: 'faculty',
    },
    {
      id: crypto.randomUUID(),
      first_name: 'Alex',
      last_name: 'Rivera',
      email: 'alex@student.com',
      password_hash: passwordHash,
      role: 'student',
    },
    {
      id: crypto.randomUUID(),
      first_name: 'Maria',
      last_name: 'Chen',
      email: 'maria@student.com',
      password_hash: passwordHash,
      role: 'student',
    },
    {
      id: crypto.randomUUID(),
      first_name: 'Academy',
      last_name: 'Admin',
      email: 'admin@academy.com',
      password_hash: passwordHash,
      role: 'admin',
    },
  ];

  for (const u of users) {
    await query(`
      INSERT INTO users (id, first_name, last_name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `, u.id, u.first_name, u.last_name, u.email, u.password_hash, u.role);
  }

  const mentorId = users[0].id;
  const facultyId = users[1].id;
  const alexId = users[2].id;
  const mariaId = users[3].id;

  // 2. Student Profiles
  // Alex: Fresh student who hasn't taken Entrance Exam
  await query(`
    INSERT INTO student_profiles (user_id, assigned_mentor_id, assigned_faculty_id, current_level, entrance_completed)
    VALUES (?, ?, ?, 'beginner', 0)
  `, alexId, mentorId, facultyId);

  // Maria: Has completed entrance exam, placed in Intermediate
  await query(`
    INSERT INTO student_profiles (user_id, assigned_mentor_id, assigned_faculty_id, current_level, entrance_completed)
    VALUES (?, ?, ?, 'intermediate', 1)
  `, mariaId, mentorId, facultyId);

  // 3. Courses
  const courseCs101Id = crypto.randomUUID();
  const courseWeb201Id = crypto.randomUUID();

  await query(`
    INSERT INTO courses (id, title, code, description)
    VALUES (?, ?, ?, ?)
  `, 
    courseCs101Id,
    'C Programming Language: Zero to Hero',
    'C101',
    'Master the C language fundamentals including pointers, memory management, data types, and systems programming.'
  );

  await query(`
    INSERT INTO courses (id, title, code, description)
    VALUES (?, ?, ?, ?)
  `, 
    courseWeb201Id,
    'Web Architecture & Modern Full-Stack Systems',
    'WEB201',
    'From core HTTP protocols and DOM manipulation to reactive state architectures, high-concurrency microservices, and cloud caching.'
  );

  // 4. Modules for CS101
  const modules = [
    // Beginner Tier
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 1.1: C Fundamentals, Syntax & Setup',
      level: 'beginner',
      sequence_order: 1,
      study_time_recommended: 60,
      content_body: '# C Fundamentals\nWelcome to C Programming. We will cover compilation using gcc, basic syntax, and standard I/O (printf, scanf).'
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 1.2: Control Flow & Loops',
      level: 'beginner',
      sequence_order: 2,
      study_time_recommended: 60,
      content_body: '# Control Flow\nDive into conditional statements (if, switch) and iteration (for, while, do-while).'
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 1.3: Arrays & Strings',
      level: 'beginner',
      sequence_order: 3,
      study_time_recommended: 90,
      content_body: '# Arrays & Strings\nMaster static arrays and null-terminated character arrays in C.'
    },
    // Intermediate Tier
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 2.1: Functions, Scope & Recursion',
      level: 'intermediate',
      sequence_order: 1,
      study_time_recommended: 90,
      content_body: '# Functions\nUnderstanding call-by-value, stack frames, and recursive implementations.'
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 2.2: Pointers & Pointer Arithmetic',
      level: 'intermediate',
      sequence_order: 2,
      study_time_recommended: 120,
      content_body: '# Pointers\nThe heart of C: memory addresses, dereferencing, and traversing arrays using pointer arithmetic.'
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 2.3: Dynamic Memory Management',
      level: 'intermediate',
      sequence_order: 3,
      study_time_recommended: 120,
      content_body: '# Dynamic Memory\nHeap allocation using malloc, calloc, realloc, and avoiding memory leaks with free.'
    },
    // Advanced Tier
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 3.1: Structs, Unions & Bit-Fields',
      level: 'advanced',
      sequence_order: 1,
      study_time_recommended: 90,
      content_body: '# Complex Types\nCreating custom data structures, memory padding, alignment, and bitwise operations.'
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 3.2: Preprocessors & Macros',
      level: 'advanced',
      sequence_order: 2,
      study_time_recommended: 60,
      content_body: '# Preprocessor\nConditional compilation, header guards, and writing safe parametric macros.'
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 3.3: File I/O & Systems Programming',
      level: 'advanced',
      sequence_order: 3,
      study_time_recommended: 120,
      content_body: '# File I/O\nReading and writing binary and text files via streams (fopen, fread, fwrite).'
    }
  ];

  for (const mod of modules) {
    await query(`
      INSERT INTO modules (id, course_id, title, level, sequence_order, study_time_recommended, content_body)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, 
      mod.id,
      mod.course_id,
      mod.title,
      mod.level,
      mod.sequence_order,
      mod.study_time_recommended,
      mod.content_body
    );
  }

  // 5. Question Bank (At least 10 Beginner, 10 Intermediate, 10 Advanced for CS101)
  const questions = [
  // Beginner
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'What is the correct way to declare an integer variable in C?', option_a: 'int num;', option_b: 'integer num;', option_c: 'num int;', option_d: 'var num: int;', correct_option: 'A' },
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'Which operator is used to get the memory address of a variable?', option_a: '*', option_b: '&&', option_c: '&', option_d: '->', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'What is the size of a standard "char" data type in C?', option_a: '1 byte', option_b: '2 bytes', option_c: '4 bytes', option_d: 'Depends on the compiler', correct_option: 'A' },
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'Which function is used to read formatted input from standard input?', option_a: 'printf()', option_b: 'read()', option_c: 'scanf()', option_d: 'cin', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'How do you terminate a C statement?', option_a: 'With a colon (::)', option_b: 'With a period (.)', option_c: 'With a semicolon (;)', option_d: 'With a newline', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'Which loop is guaranteed to execute at least once?', option_a: 'for', option_b: 'while', option_c: 'do-while', option_d: 'foreach', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'What character terminates a string in C?', option_a: '\\n', option_b: '\\0', option_c: 'EOF', option_d: 'NULL', correct_option: 'B' },
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'What is the format specifier for a float?', option_a: '%d', option_b: '%f', option_c: '%c', option_d: '%s', correct_option: 'B' },
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'What happens if you omit the return type of a function in old C?', option_a: 'Syntax error', option_b: 'Defaults to void', option_c: 'Defaults to int', option_d: 'Compiler warning only', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'beginner', question_text: 'Which header file contains standard I/O functions?', option_a: '<stdlib.h>', option_b: '<string.h>', option_c: '<stdio.h>', option_d: '<math.h>', correct_option: 'C' },
  // Intermediate
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'What does the "malloc" function return on failure?', option_a: '0', option_b: '-1', option_c: 'NULL', option_d: 'An exception', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'If p is a pointer to an integer, what does p++ do?', option_a: 'Increments the value p points to', option_b: 'Increments the address by 1 byte', option_c: 'Increments the address by sizeof(int)', option_d: 'Syntax error', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'Which function automatically initializes allocated memory to zero?', option_a: 'malloc', option_b: 'calloc', option_c: 'realloc', option_d: 'memset', correct_option: 'B' },
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'What is the correct syntax to define a pointer to a function returning an int and taking no arguments?', option_a: 'int *func();', option_b: 'int (*func)();', option_c: '(int *)func();', option_d: 'int func(*);', correct_option: 'B' },
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'How do you access a member "age" of a struct via a pointer "p"?', option_a: 'p.age', option_b: 'p->age', option_c: '*p.age', option_d: 'age.p', correct_option: 'B' },
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'What is a memory leak in C?', option_a: 'Accessing an out-of-bounds array', option_b: 'Failing to free allocated heap memory', option_c: 'Dereferencing a NULL pointer', option_d: 'Stack overflow from recursion', correct_option: 'B' },
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'What is the output of sizeof(char*) on a 64-bit system?', option_a: '1', option_b: '4', option_c: '8', option_d: 'Varies', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'Which keyword is used to prevent a variable from being optimized out by the compiler?', option_a: 'const', option_b: 'static', option_c: 'volatile', option_d: 'register', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'What does the "static" keyword do when applied to a local variable?', option_a: 'Makes it accessible globally', option_b: 'Preserves its value between function calls', option_c: 'Prevents it from being modified', option_d: 'Forces allocation on the heap', correct_option: 'B' },
  { course_id: courseCs101Id, difficulty: 'intermediate', question_text: 'What is the difference between passing by value and passing by reference in C?', option_a: 'C only supports pass by reference natively', option_b: 'C only supports pass by value natively', option_c: 'Pass by reference passes a copy', option_d: 'There is no difference', correct_option: 'B' },
  // Advanced
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'What is a "dangling pointer"?', option_a: 'A pointer initialized to NULL', option_b: 'A pointer pointing to a memory location that has been freed', option_c: 'A pointer to a function', option_d: 'A pointer cast to void*', correct_option: 'B' },
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'What is the purpose of the #pragma pack directive?', option_a: 'To include header files only once', option_b: 'To optimize loops', option_c: 'To control struct memory alignment and padding', option_d: 'To define macros', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'What happens if you call free() on a pointer that is not pointing to heap memory?', option_a: 'Memory leak', option_b: 'Nothing', option_c: 'Undefined behavior / Segmentation fault', option_d: 'Compilation error', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'In C, what is a "union"?', option_a: 'A struct where all members share the same memory location', option_b: 'A data structure that can hold unlimited items', option_c: 'A way to link two object files', option_d: 'A thread synchronization primitive', correct_option: 'A' },
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'Which function is used to change the size of a previously allocated memory block?', option_a: 'malloc', option_b: 'calloc', option_c: 'realloc', option_d: 'resize', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'What is the macro __FILE__ used for?', option_a: 'To open a file', option_b: 'To read standard input', option_c: 'To expand to the current source file name', option_d: 'To define a file descriptor', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'What is the consequence of a buffer overflow in C?', option_a: 'It automatically resizes the array', option_b: 'It raises an exception caught by the runtime', option_c: 'It overwrites adjacent memory leading to vulnerabilities', option_d: 'It safely truncates the data', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'How can you declare a constant pointer to a constant integer?', option_a: 'const int * p;', option_b: 'int const * p;', option_c: 'const int * const p;', option_d: 'int * const p;', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'What does "fopen" return if a file cannot be opened?', option_a: 'EOF', option_b: '0', option_c: 'NULL', option_d: '-1', correct_option: 'C' },
  { course_id: courseCs101Id, difficulty: 'advanced', question_text: 'What is the purpose of the "extern" keyword?', option_a: 'To declare a variable defined in another translation unit', option_b: 'To export a function to a DLL', option_c: 'To allocate memory outside the program', option_d: 'To terminate the program', correct_option: 'A' }
];

  for (const q of questions) {
    await query(`
      INSERT INTO question_bank (id, course_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      crypto.randomUUID(),
      q.course_id,
      q.difficulty,
      q.question_text,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_option
    );
  }

  // 6. Seed sample progress and pending test request for Maria
  const mariaModule = modules[3]; // Module 2.1 Linked Lists
  await query(`
    INSERT INTO student_module_progress (student_id, module_id, time_spent_minutes, is_completed)
    VALUES (?, ?, 195, 1)
  `, mariaId, mariaModule.id);

  await query(`
    INSERT INTO test_requests (id, student_id, module_id, reviewer_id, status, time_spent_minutes)
    VALUES (?, ?, ?, ?, 'pending', 195)
  `, crypto.randomUUID(), mariaId, mariaModule.id, mentorId);

  console.log('✅ Database seeded successfully!');
  console.log(`- Users: ${users.length}`);
  console.log(`- Modules: ${modules.length}`);
  console.log(`- Questions: ${questions.length}`);
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

