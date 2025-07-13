<?php
// Include the configuration file
require_once __DIR__ . '/config.php';

function renderFooter() {
    // Get the correct asset path for JavaScript
    $assetPath = getAssetPath($_SERVER['SCRIPT_NAME']);
    
    return '
        </div> <!-- End main-container -->
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="' . $assetPath . 'js/global.js"></script>
    </body>
    </html>';
}
?>