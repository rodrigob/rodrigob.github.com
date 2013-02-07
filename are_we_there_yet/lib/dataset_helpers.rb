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
			|| "#{group.downcase}_datasets_results.html##{dataset_anchor dataset}" \
			|| "#"
		else
		"#"
		end
	end

    def dataset_results dataset_name
		results = data.curated_data.select {|d| d.dataset_name == dataset_name }
		results = results.sort { |a, b| a[:result] <=> b[:result] }
		results
	end
end
