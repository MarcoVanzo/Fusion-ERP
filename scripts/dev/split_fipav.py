import sys

with open("api/Modules/Results/FipavScraperClient.php", "r") as f:
    lines = f.readlines()

client_lines = lines[:216]
parser_lines = lines[216:1126] # everything from // PRIVATE - PARSERS till the end

# Fix client
client_lines.append("}\n")

with open("api/Modules/Results/FipavScraperClient.php", "w") as f:
    f.writelines(client_lines)

# Create parser service
parser_content = "<?php\n\n"
parser_content += "declare(strict_types=1);\n\n"
parser_content += "namespace FusionERP\\Modules\\Results\\Services;\n\n"
parser_content += "class FipavParserService\n{\n"
parser_content += "    private $isOurTeamCallback;\n\n"
parser_content += "    public function __construct(?callable $isOurTeamCallback = null) {\n"
parser_content += "        $this->isOurTeamCallback = $isOurTeamCallback;\n"
parser_content += "    }\n\n"
parser_content += "    private function isOurTeam(string ...$names): bool {\n"
parser_content += "        if ($this->isOurTeamCallback) {\n"
parser_content += "            return call_user_func($this->isOurTeamCallback, ...$names);\n"
parser_content += "        }\n"
parser_content += "        return false;\n"
parser_content += "    }\n\n"

with open("api/Modules/Results/Services/FipavParserService.php", "w") as f:
    f.write(parser_content)
    # Filter out CONST references gracefully or just inject it
    # Need to replace `self::BASE_URL` with a static or fetch from FipavScraperClient::BASE_URL
    import re
    cleaned_parser_lines = []
    for line in parser_lines:
        line = re.sub(r"self::BASE_URL", r"\\FusionERP\\Modules\\Results\\FipavScraperClient::BASE_URL", line)
        cleaned_parser_lines.append(line)
        
    f.writelines(cleaned_parser_lines)
    f.write("\n}\n")

