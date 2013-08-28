# see http://middlemanapp.com/helpers

require "digest"

module DatasetHelpers

	def dataset_anchor dataset
		Digest.hexencode dataset.name
	end

	def dataset_url dataset

		if dataset then
			group = dataset.group || "no_group"
			
			dataset.external_results_url \
			|| "#{normalized_group_name group}_datasets_results.html##{dataset_anchor dataset}" \
			|| "#"
		else
		"#"
		end
	end

    def dataset_results dataset_name
		results = data.curated_data.select {|d| d.dataset_name == dataset_name }
		results = results.sort { |a, b| a[:result] <=> b[:result] } 
		last_result = if results.last then results.last[:result] else "0" end
		if last_result.strip.to_i > 51 then 
		  # it it seems to be a lost of precision, not error
		  results = results.reverse
		end
		results
	end

	def normalized_group_name dataset_group
		dataset_group.downcase.gsub(" ", "_")
	end
end
