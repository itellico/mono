<?php
function createBreadcrumb($items) {
    $breadcrumb = '<nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">';
    
    foreach ($items as $index => $item) {
        $isLast = $index === count($items) - 1;
        if ($isLast) {
            $breadcrumb .= '<li class="breadcrumb-item active" aria-current="page">' . htmlspecialchars($item['label']) . '</li>';
        } else {
            $href = isset($item['href']) ? htmlspecialchars($item['href']) : '#';
            $breadcrumb .= '<li class="breadcrumb-item"><a href="' . $href . '">' . htmlspecialchars($item['label']) . '</a></li>';
        }
    }
    
    $breadcrumb .= '</ol></nav>';
    return $breadcrumb;
}

function createStatCard($title, $value, $icon, $color = 'primary') {
    return '
    <div class="col-md-3 mb-4">
        <div class="card border-' . htmlspecialchars($color) . ' stat-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="text-muted mb-2">' . htmlspecialchars($title) . '</h6>
                        <h3 class="mb-0">' . htmlspecialchars($value) . '</h3>
                    </div>
                    <div class="text-' . htmlspecialchars($color) . '">
                        <i class="' . htmlspecialchars($icon) . ' fa-2x"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>';
}

function createDataTable($title, $headers, $rows, $actions = true) {
    $table = '
    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">' . htmlspecialchars($title) . '</h5>
            <button class="btn btn-primary btn-sm">
                <i class="fas fa-plus me-2"></i> Add New
            </button>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>';
    
    foreach ($headers as $header) {
        $table .= '<th>' . htmlspecialchars($header) . '</th>';
    }
    
    if ($actions) {
        $table .= '<th>Actions</th>';
    }
    
    $table .= '</tr></thead><tbody>';
    
    foreach ($rows as $row) {
        $table .= '<tr>';
        foreach ($row as $cell) {
            $table .= '<td>' . $cell . '</td>'; // Allow HTML for badges, etc.
        }
        if ($actions) {
            $table .= '
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>';
        }
        $table .= '</tr>';
    }
    
    $table .= '</tbody></table></div></div></div>';
    return $table;
}

function createHeroSection($title, $description, $image, $actions = []) {
    $hero = '
    <div class="row mb-4">
        <div class="col-12">
            <div class="card overflow-hidden">
                <div class="position-relative">
                    <img src="' . htmlspecialchars($image) . '" 
                         class="w-100" style="height: 200px; object-fit: cover;" alt="' . htmlspecialchars($title) . '">
                    <div class="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center">
                        <div class="container text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h1 class="h3 mb-2">' . htmlspecialchars($title) . '</h1>
                                    <p class="mb-0">' . htmlspecialchars($description) . '</p>
                                </div>';
    
    if (!empty($actions)) {
        $hero .= '<div class="btn-group">';
        foreach ($actions as $action) {
            $hero .= '<button class="btn btn-' . htmlspecialchars($action['style'] ?? 'light') . '">';
            if (isset($action['icon'])) {
                $hero .= '<i class="' . htmlspecialchars($action['icon']) . ' me-2"></i>';
            }
            $hero .= htmlspecialchars($action['label']) . '</button>';
        }
        $hero .= '</div>';
    }
    
    $hero .= '
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>';
    
    return $hero;
}

function createCard($title, $content, $footer = '', $class = '') {
    return '
    <div class="card ' . htmlspecialchars($class) . '">
        <div class="card-header">
            <h5 class="mb-0">' . htmlspecialchars($title) . '</h5>
        </div>
        <div class="card-body">
            ' . $content . '
        </div>
        ' . ($footer ? '<div class="card-footer">' . $footer . '</div>' : '') . '
    </div>';
}

function createAlert($message, $type = 'info', $dismissible = true) {
    $alert = '<div class="alert alert-' . htmlspecialchars($type);
    if ($dismissible) {
        $alert .= ' alert-dismissible fade show';
    }
    $alert .= '" role="alert">';
    $alert .= htmlspecialchars($message);
    if ($dismissible) {
        $alert .= '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
    }
    $alert .= '</div>';
    return $alert;
}

function createModal($id, $title, $content, $footer = '') {
    return '
    <div class="modal fade" id="' . htmlspecialchars($id) . '" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">' . htmlspecialchars($title) . '</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ' . $content . '
                </div>
                ' . ($footer ? '<div class="modal-footer">' . $footer . '</div>' : '') . '
            </div>
        </div>
    </div>';
}
?>