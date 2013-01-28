
require "bundler"
require "psych"
require "google_drive"


session = GoogleDrive.login( ENV['google_mail'], ENV['google_password'])

spreadsheet_key = "0AqLzqcYZJN2cdEhBMlFpUzU2OTZHUXNoWW1aNlJvOUE"
spreadsheet = session.spreadsheet_by_key(spreadsheet_key)
data_worksheet = spreadsheet.worksheets[1]
datasets_worksheet = spreadsheet.worksheets[3]

if data_worksheet.title != "Curated data" then
	raise "Got the wrong data worksheet" 
end

if datasets_worksheet.title != "Curated data" then
	raise "Got the wrong datasets worksheet" 
end

curated_data = read_curated_data data_worksheet
datasets_data = read_datasets_data datasets_worksheet

save_data curated_data, "data/test_curated_data.yml"
save_data datasets_data, "data/test_dataset.yml"


#for row in 1..ws.num_rows
#  for col in 1..ws.num_cols
#    p ws[row, col]
#  end
#end

worksheet.rows


data_path = "data/test_data.yml"
out_file = File.open(data_path, "w")

Psych.dump(data, out_file)

out_file.close())

puts "Updated data file #{data_path}"

