<?php
/**
 * PHP MySQL API Bridge untuk Aplikasi Pengambilan Rapor Mumtaz di cPanel
 * 
 * Silakan edit kredensial database di bawah ini sesuai dengan akun MySQL Anda di cPanel.
 */

// Kredensial Database MySQL cPanel Anda
define('DB_HOST', 'localhost');
define('DB_NAME', 'NAMA_DATABASE_ANDA'); // Ganti dengan nama database Anda
define('DB_USER', 'USERNAME_DB_ANDA');   // Ganti dengan username database Anda
define('DB_PASS', 'PASSWORD_DB_ANDA');   // Ganti dengan password database Anda

// Header Pengaturan Respons JSON & CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Tangani metode OPTIONS (preflight request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Hubungkan ke MySQL menggunakan PDO
    $pdo = new PDO("mysql:host=" . DB_HOST . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Buat database jika belum ada (opsional, jika hak akses pengguna cPanel mendukung)
    // Direkomendasikan membuat nama tabel langsung pada database yang sudah disiapkan di cPanel
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `" . DB_NAME . "`");

    // === OTOMATIS MEMBUAT TABEL JIKA BELUM ADA ===
    
    // 1. Tabel Students
    $pdo->exec("CREATE TABLE IF NOT EXISTS `rapor_students` (
        `id` VARCHAR(100) NOT NULL,
        `name` VARCHAR(255) NOT NULL,
        `className` VARCHAR(100) NOT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 2. Tabel Bookings
    $pdo->exec("CREATE TABLE IF NOT EXISTS `rapor_bookings` (
        `id` VARCHAR(100) NOT NULL,
        `studentId` VARCHAR(100) NOT NULL UNIQUE,
        `studentName` VARCHAR(255) NOT NULL,
        `className` VARCHAR(100) NOT NULL,
        `parentName` VARCHAR(255) NOT NULL,
        `parentPhone` VARCHAR(100) NOT NULL,
        `timeSlot` VARCHAR(100) NOT NULL,
        `period` VARCHAR(20) NOT NULL,
        `bookedAt` VARCHAR(100) NOT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 3. Tabel Class Limits
    $pdo->exec("CREATE TABLE IF NOT EXISTS `rapor_class_limits` (
        `className` VARCHAR(100) NOT NULL,
        `maxLimit` VARCHAR(100) NOT NULL,
        PRIMARY KEY (`className`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // === SEEDING SISWA OTOMATIS JIKA KOSONG ===
    $countStudents = $pdo->query("SELECT COUNT(*) FROM `rapor_students`")->fetchColumn();
    if ($countStudents == 0) {
        $seedStudents = [
            // Kelas 7
            ["id" => "s7-1", "name" => "Achmad Daffa Almirzaki", "className" => "Kelas 7"],
            ["id" => "s7-2", "name" => "Al A'Raaf Rafif Qurahman", "className" => "Kelas 7"],
            ["id" => "s7-3", "name" => "Albilly Asadil Shabran", "className" => "Kelas 7"],
            ["id" => "s7-4", "name" => "Alfarezi Ahza Setiadi", "className" => "Kelas 7"],
            ["id" => "s7-5", "name" => "Alif Azidane Azmi", "className" => "Kelas 7"],
            ["id" => "s7-6", "name" => "Ammar Raqilla Furqon", "className" => "Kelas 7"],
            ["id" => "s7-7", "name" => "Candra Ibrahim Kurniawan", "className" => "Kelas 7"],
            ["id" => "s7-8", "name" => "Dzaka Adibi Avicena", "className" => "Kelas 7"],
            ["id" => "s7-9", "name" => "Dzaky Bima Prayoga", "className" => "Kelas 7"],
            ["id" => "s7-10", "name" => "Faiz Mubarok", "className" => "Kelas 7"],
            ["id" => "s7-11", "name" => "Harun Al Rasyid Nugroho", "className" => "Kelas 7"],
            ["id" => "s7-12", "name" => "Jaya Raya Habibie Sofyan", "className" => "Kelas 7"],
            ["id" => "s7-13", "name" => "Kenzie Raffi Mahendra", "className" => "Kelas 7"],
            ["id" => "s7-14", "name" => "Muhammad Al Hafizhi", "className" => "Kelas 7"],
            ["id" => "s7-15", "name" => "Muhammad Dimas Algibran", "className" => "Kelas 7"],
            ["id" => "s7-16", "name" => "Muhammad Fachrel Rakaan Negara", "className" => "Kelas 7"],
            ["id" => "s7-17", "name" => "Muhammad Imam Al Ramadhan", "className" => "Kelas 7"],
            ["id" => "s7-18", "name" => "Muhammad Rasyid Farizki", "className" => "Kelas 7"],
            ["id" => "s7-19", "name" => "Raffasyah Dzaki Alvaro", "className" => "Kelas 7"],
            ["id" => "s7-20", "name" => "Risyad Yaqdhan Khairy", "className" => "Kelas 7"],
            ["id" => "s7-21", "name" => "Yusuf Daanish Fadhlurrohman", "className" => "Kelas 7"],

            // Kelas 8
            ["id" => "s8-1", "name" => "Ahmad Barra Atharayhan", "className" => "Kelas 8"],
            ["id" => "s8-2", "name" => "Akbar Rizki Langit", "className" => "Kelas 8"],
            ["id" => "s8-3", "name" => "Billy Faaruuq Kabsya Marjoko", "className" => "Kelas 8"],
            ["id" => "s8-4", "name" => "Dhimas Al Maajid Surya Setyadi", "className" => "Kelas 8"],
            ["id" => "s8-5", "name" => "Fathan Emeraldy Dwitama", "className" => "Kelas 8"],
            ["id" => "s8-6", "name" => "Haikal Akbar", "className" => "Kelas 8"],
            ["id" => "s8-7", "name" => "Khalid Tanuarga Rizla", "className" => "Kelas 8"],
            ["id" => "s8-8", "name" => "M. Ammar Azzam", "className" => "Kelas 8"],
            ["id" => "s8-9", "name" => "M. Arkaantama", "className" => "Kelas 8"],
            ["id" => "s8-10", "name" => "M. Dzaky Akmal Seoja", "className" => "Kelas 8"],
            ["id" => "s8-11", "name" => "M. Faliandra El Fariid", "className" => "Kelas 8"],
            ["id" => "s8-12", "name" => "M. Rafa Keitaro M.", "className" => "Kelas 8"],
            ["id" => "s8-13", "name" => "M. Thoriq Alfajri Khoir", "className" => "Kelas 8"],
            ["id" => "s8-14", "name" => "Muhammad Agha Haidar Edrika", "className" => "Kelas 8"],
            ["id" => "s8-15", "name" => "Muhammad Antar", "className" => "Kelas 8"],
            ["id" => "s8-16", "name" => "Raden Prabu Ridhollah", "className" => "Kelas 8"],
            ["id" => "s8-17", "name" => "Rizqullah Qary Faddilah", "className" => "Kelas 8"],
            ["id" => "s8-18", "name" => "Suja'i", "className" => "Kelas 8"],
            ["id" => "s8-19", "name" => "Yuki Dyta Ramadhan", "className" => "Kelas 8"],
            ["id" => "s8-20", "name" => "Zaidan Ibrahim", "className" => "Kelas 8"],
            ["id" => "s8-21", "name" => "Zarko Jabbar Al-Yildislillar Triloka", "className" => "Kelas 8"],

            // Kelas 10
            ["id" => "s10-1", "name" => "Ebi Irawan Ardianto", "className" => "Kelas 10"],
            ["id" => "s10-2", "name" => "Farrel Ikhwan Suryawan", "className" => "Kelas 10"],
            ["id" => "s10-3", "name" => "Fathan Ditya R", "className" => "Kelas 10"],
            ["id" => "s10-4", "name" => "Labib Luthfan Hisyam", "className" => "Kelas 10"],
            ["id" => "s10-5", "name" => "Muhammad Dzaki Jamail", "className" => "Kelas 10"],
            ["id" => "s10-6", "name" => "Raihan Yusuf Kurniawan", "className" => "Kelas 10"],

            // Kelas 11
            ["id" => "s11-1", "name" => "Ahmad Nurrohman", "className" => "Kelas 11"],
            ["id" => "s11-2", "name" => "Bintang Jauhar", "className" => "Kelas 11"],
            ["id" => "s11-3", "name" => "Bunayya Liwa Al Hamd", className: "Kelas 11"],
            ["id" => "s11-4", "name" => "Daffa Ramadhan Putra", "className" => "Kelas 11"],
            ["id" => "s11-5", "name" => "Daniya Rahman Zharif", "className" => "Kelas 11"],
            ["id" => "s11-6", "name" => "Fakhri Rizki Kowasanda", "className" => "Kelas 11"],
            ["id" => "s11-7", "name" => "M. Ariz Faiq", "className" => "Kelas 11"],
            ["id" => "s11-8", "name" => "M. Said Probo Kusumo", "className" => "Kelas 11"],
            ["id" => "s11-9", "name" => "Muhammad Arrofi Alydrus", "className" => "Kelas 11"],
            ["id" => "s11-10", "name" => "Muhammad Azzam Maulana", "className" => "Kelas 11"],
            ["id" => "s11-11", "name" => "Muhammad Kenzi Sholihan", "className" => "Kelas 11"],
            ["id" => "s11-12", "name" => "Neo Herdy Samantha", "className" => "Kelas 11"]
        ];
        $stmt = $pdo->prepare("INSERT INTO `rapor_students` (`id`, `name`, `className`) VALUES (:id, :name, :className)");
        foreach ($seedStudents as $student) {
            $stmt->execute($student);
        }
    }

} catch (PDOException $e) {
    if ($e->getCode() == 1045 || $e->getCode() == 2002) {
        // Gagal menyambungkan ke SQL (karena kredensial bawaan/default belum diubah)
        // Kita keluarkan respons terpandu agar pengguna tahu mereka harus mengonfigurasi database MySQL mereka di cPanel
        echo json_encode([
            "status" => "need_config",
            "message" => "MySQL Connection Pending. Please configure your DB credentials inside api.php",
            "error_code" => $e->getCode()
        ]);
        exit();
    }
    
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Koneksi database gagal: " . $e->getMessage()
    ]);
    exit();
}

// === ROUTING ACTION ===
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'ping':
        echo json_encode([
            "status" => "connected",
            "database" => DB_NAME,
            "provider" => "mysql"
        ]);
        break;

    case 'get_data':
        try {
            // Get Students
            $students = $pdo->query("SELECT * FROM `rapor_students` ORDER BY `name` ASC")->fetchAll();
            
            // Get Bookings
            $bookings = $pdo->query("SELECT * FROM `rapor_bookings`")->fetchAll();
            
            // Get Class Limits
            $limitsRaw = $pdo->query("SELECT * FROM `rapor_class_limits`")->fetchAll();
            $classLimits = [];
            foreach ($limitsRaw as $row) {
                $classLimits[$row['className']] = $row['maxLimit'];
            }

            echo json_encode([
                "status" => "success",
                "students" => $students,
                "bookings" => $bookings,
                "classLimits" => $classLimits
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'add_student':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) $input = $_POST;

            $id = isset($input['id']) ? $input['id'] : 'student-' . uniqid() . '-' . rand(100, 999);
            $name = trim($input['name']);
            $className = $input['className'];

            if (empty($name) || empty($className)) {
                throw new Exception("Nama dan kelas harus diisi!");
            }

            $stmt = $pdo->prepare("INSERT INTO `rapor_students` (`id`, `name`, `className`) VALUES (:id, :name, :className)");
            $stmt->execute([
                "id" => $id,
                "name" => $name,
                "className" => $className
            ]);

            echo json_encode([
                "id" => $id,
                "name" => $name,
                "className" => $className
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'delete_student':
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if (empty($id)) throw new Exception("ID siswa kosong!");

            // Cascading delete bookings
            $stmt1 = $pdo->prepare("DELETE FROM `rapor_bookings` WHERE `studentId` = :studentId");
            $stmt1->execute(["studentId" => $id]);

            // Delete Student
            $stmt2 = $pdo->prepare("DELETE FROM `rapor_students` WHERE `id` = :id");
            $stmt2->execute(["id" => $id]);

            echo json_encode(["status" => "success", "message" => "Siswa berhasil dihapus"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'add_booking':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) $input = $_POST;

            $studentId = $input['studentId'];
            $studentName = $input['studentName'];
            $className = $input['className'];
            $parentName = trim($input['parentName']);
            $parentPhone = trim($input['parentPhone']);
            $timeSlot = $input['timeSlot'];
            $period = $input['period'];

            // Validation 1: Check duplicate slot
            $chkSlot = $pdo->prepare("SELECT COUNT(*) FROM `rapor_bookings` WHERE `className` = :className AND `timeSlot` = :timeSlot");
            $chkSlot->execute(["className" => $className, "timeSlot" => $timeSlot]);
            if ($chkSlot->fetchColumn() > 0) {
                throw new Exception("Jadwal " . $timeSlot . " sudah diisi oleh orang tua siswa lain di kelas yang sama.");
            }

            // Validation 2: Check student has already booked
            $chkStd = $pdo->prepare("SELECT COUNT(*) FROM `rapor_bookings` WHERE `studentId` = :studentId");
            $chkStd->execute(["studentId" => $studentId]);
            if ($chkStd->fetchColumn() > 0) {
                throw new Exception("Siswa " . $studentName . " sudah memiliki jadwal pengambilan rapor.");
            }

            $id = 'booking-' . uniqid() . '-' . rand(100, 999);
            $bookedAt = date('c'); // ISO 8601

            $stmt = $pdo->prepare("INSERT INTO `rapor_bookings` (`id`, `studentId`, `studentName`, `className`, `parentName`, `parentPhone`, `timeSlot`, `period`, `bookedAt`) 
                                   VALUES (:id, :studentId, :studentName, :className, :parentName, :parentPhone, :timeSlot, :period, :bookedAt)");
            $stmt->execute([
                "id" => $id,
                "studentId" => $studentId,
                "studentName" => $studentName,
                "className" => $className,
                "parentName" => $parentName,
                "parentPhone" => $parentPhone,
                "timeSlot" => $timeSlot,
                "period" => $period,
                "bookedAt" => $bookedAt
            ]);

            echo json_encode([
                "id" => $id,
                "studentId" => $studentId,
                "studentName" => $studentName,
                "className" => $className,
                "parentName" => $parentName,
                "parentPhone" => $parentPhone,
                "timeSlot" => $timeSlot,
                "period" => $period,
                "confirmed" => true,
                "bookedAt" => $bookedAt
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'delete_booking':
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if (empty($id)) throw new Exception("ID booking kosong!");

            $stmt = $pdo->prepare("DELETE FROM `rapor_bookings` WHERE `id` = :id");
            $stmt->execute(["id" => $id]);

            echo json_encode(["status" => "success", "message" => "Jadwal berhasil dihapus"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'save_class_limits':
        try {
            $limits = json_decode(file_get_contents('php://input'), true);
            if (!$limits) $limits = $_POST;

            if (!is_array($limits)) throw new Exception("Format limits harus JSON object");

            // Tulis satu per satu
            foreach ($limits as $className => $limit) {
                $stmt = $pdo->prepare("INSERT INTO `rapor_class_limits` (`className`, `maxLimit`) VALUES (:className, :maxLimit) 
                                       ON DUPLICATE KEY UPDATE `maxLimit` = :maxLimit");
                $stmt->execute([
                    "className" => $className,
                    "maxLimit" => $limit
                ]);
            }

            // Hapus yang ditiadakan
            $incomingClasses = array_keys($limits);
            if (count($incomingClasses) > 0) {
                $inQuery = implode(',', array_fill(0, count($incomingClasses), '?'));
                $stmtDel = $pdo->prepare("DELETE FROM `rapor_class_limits` WHERE `className` NOT IN ($inQuery)");
                $stmtDel->execute($incomingClasses);
            } else {
                $pdo->exec("DELETE FROM `rapor_class_limits`");
            }

            echo json_encode(["status" => "success", "message" => "Batasan kelas disimpan"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'reset_database':
        try {
            $pdo->exec("DELETE FROM `rapor_bookings`");
            $pdo->exec("DELETE FROM `rapor_students`");
            $pdo->exec("DELETE FROM `rapor_class_limits`");

            // Seed raw students back in php
            $seedStudents = [
                // Kelas 7
                ["id" => "s7-1", "name" => "Achmad Daffa Almirzaki", "className" => "Kelas 7"],
                ["id" => "s7-2", "name" => "Al A'Raaf Rafif Qurahman", "className" => "Kelas 7"],
                ["id" => "s7-3", "name" => "Albilly Asadil Shabran", "className" => "Kelas 7"],
                ["id" => "s7-4", "name" => "Alfarezi Ahza Setiadi", "className" => "Kelas 7"],
                ["id" => "s7-5", "name" => "Alif Azidane Azmi", "className" => "Kelas 7"],
                ["id" => "s7-6", "name" => "Ammar Raqilla Furqon", "className" => "Kelas 7"],
                ["id" => "s7-7", "name" => "Candra Ibrahim Kurniawan", "className" => "Kelas 7"],
                ["id" => "s7-8", "name" => "Dzaka Adibi Avicena", "className" => "Kelas 7"],
                ["id" => "s7-9", "name" => "Dzaky Bima Prayoga", "className" => "Kelas 7"],
                ["id" => "s7-10", "name" => "Faiz Mubarok", "className" => "Kelas 7"],
                ["id" => "s7-11", "name" => "Harun Al Rasyid Nugroho", "className" => "Kelas 7"],
                ["id" => "s7-12", "name" => "Jaya Raya Habibie Sofyan", "className" => "Kelas 7"],
                ["id" => "s7-13", "name" => "Kenzie Raffi Mahendra", "className" => "Kelas 7"],
                ["id" => "s7-14", "name" => "Muhammad Al Hafizhi", "className" => "Kelas 7"],
                ["id" => "s7-15", "name" => "Muhammad Dimas Algibran", "className" => "Kelas 7"],
                ["id" => "s7-16", "name" => "Muhammad Fachrel Rakaan Negara", "className" => "Kelas 7"],
                ["id" => "s7-17", "name" => "Muhammad Imam Al Ramadhan", "className" => "Kelas 7"],
                ["id" => "s7-18", "name" => "Muhammad Rasyid Farizki", "className" => "Kelas 7"],
                ["id" => "s7-19", "name" => "Raffasyah Dzaki Alvaro", "className" => "Kelas 7"],
                ["id" => "s7-20", "name" => "Risyad Yaqdhan Khairy", "className" => "Kelas 7"],
                ["id" => "s7-21", "name" => "Yusuf Daanish Fadhlurrohman", "className" => "Kelas 7"],

                // Kelas 8
                ["id" => "s8-1", "name" => "Ahmad Barra Atharayhan", "className" => "Kelas 8"],
                ["id" => "s8-2", "name" => "Akbar Rizki Langit", "className" => "Kelas 8"],
                ["id" => "s8-3", "name" => "Billy Faaruuq Kabsya Marjoko", "className" => "Kelas 8"],
                ["id" => "s8-4", "name" => "Dhimas Al Maajid Surya Setyadi", "className" => "Kelas 8"],
                ["id" => "s8-5", "name" => "Fathan Emeraldy Dwitama", "className" => "Kelas 8"],
                ["id" => "s8-6", "name" => "Haikal Akbar", "className" => "Kelas 8"],
                ["id" => "s8-7", "name" => "Khalid Tanuarga Rizla", "className" => "Kelas 8"],
                ["id" => "s8-8", "name" => "M. Ammar Azzam", "className" => "Kelas 8"],
                ["id" => "s8-9", "name" => "M. Arkaantama", "className" => "Kelas 8"],
                ["id" => "s8-10", "name" => "M. Dzaky Akmal Seoja", "className" => "Kelas 8"],
                ["id" => "s8-11", "name" => "M. Faliandra El Fariid", "className" => "Kelas 8"],
                ["id" => "s8-12", "name" => "M. Rafa Keitaro M.", "className" => "Kelas 8"],
                ["id" => "s8-13", "name" => "M. Thoriq Alfajri Khoir", "className" => "Kelas 8"],
                ["id" => "s8-14", "name" => "Muhammad Agha Haidar Edrika", "className" => "Kelas 8"],
                ["id" => "s8-15", "name" => "Muhammad Antar", "className" => "Kelas 8"],
                ["id" => "s8-16", "name" => "Raden Prabu Ridhollah", "className" => "Kelas 8"],
                ["id" => "s8-17", "name" => "Rizqullah Qary Faddilah", "className" => "Kelas 8"],
                ["id" => "s8-18", "name" => "Suja'i", "className" => "Kelas 8"],
                ["id" => "s8-19", "name" => "Yuki Dyta Ramadhan", "className" => "Kelas 8"],
                ["id" => "s8-20", "name" => "Zaidan Ibrahim", "className" => "Kelas 8"],
                ["id" => "s8-21", "name" => "Zarko Jabbar Al-Yildislillar Triloka", "className" => "Kelas 8"],

                // Kelas 10
                ["id" => "s10-1", "name" => "Ebi Irawan Ardianto", "className" => "Kelas 10"],
                ["id" => "s10-2", "name" => "Farrel Ikhwan Suryawan", "className" => "Kelas 10"],
                ["id" => "s10-3", "name" => "Fathan Ditya R", "className" => "Kelas 10"],
                ["id" => "s10-4", "name" => "Labib Luthfan Hisyam", "className" => "Kelas 10"],
                ["id" => "s10-5", "name" => "Muhammad Dzaki Jamail", "className" => "Kelas 10"],
                ["id" => "s10-6", "name" => "Raihan Yusuf Kurniawan", "className" => "Kelas 10"],

                // Kelas 11
                ["id" => "s11-1", "name" => "Ahmad Nurrohman", "className" => "Kelas 11"],
                ["id" => "s11-2", "name" => "Bintang Jauhar", "className" => "Kelas 11"],
                ["id" => "s11-3", "name" => "Bunayya Liwa Al Hamd", "className" => "Kelas 11"],
                ["id" => "s11-4", "name" => "Daffa Ramadhan Putra", "className" => "Kelas 11"],
                ["id" => "s11-5", "name" => "Daniya Rahman Zharif", "className" => "Kelas 11"],
                ["id" => "s11-6", "name" => "Fakhri Rizki Kowasanda", "className" => "Kelas 11"],
                ["id" => "s11-7", "name" => "M. Ariz Faiq", "className" => "Kelas 11"],
                ["id" => "s11-8", "name" => "M. Said Probo Kusumo", "className" => "Kelas 11"],
                ["id" => "s11-9", "name" => "Muhammad Arrofi Alydrus", "className" => "Kelas 11"],
                ["id" => "s11-10", "name" => "Muhammad Azzam Maulana", "className" => "Kelas 11"],
                ["id" => "s11-11", "name" => "Muhammad Kenzi Sholihan", "className" => "Kelas 11"],
                ["id" => "s11-12", "name" => "Neo Herdy Samantha", "className" => "Kelas 11"]
            ];
            $stmt = $pdo->prepare("INSERT INTO `rapor_students` (`id`, `name`, `className`) VALUES (:id, :name, :className)");
            foreach ($seedStudents as $student) {
                $stmt->execute($student);
            }

            echo json_encode([
                "status" => "success",
                "students" => $seedStudents,
                "bookings" => [],
                "classLimits" => (object)[]
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode([
            "status" => "unknown_action",
            "message" => "Please pass a valid action query parameter, e.g. api.php?action=get_data"
        ]);
        break;
}
