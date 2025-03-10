import React, { useEffect, useState,memo } from "react";
import { getAllImages } from "../api";
const ImageGallery = () => {
	const [images, setImages] = useState([]);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		const fetchImages = async () => {
			const data = await getAllImages();
			setImages(data);
			setLoading(false);
		};
		fetchImages();
	}, []);

	return (
		<div>
			<h1>Processed Images</h1> 
				{loading ? ( 
					<p>Loading...</p>
				) : (
					<div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
						{images.map((image) => (
							<div key={image.imageKey} style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
								<img src={image.imageUrl} alt={image.description} style={{ width: "200px", height: "200px" }} />
								<p><strong>Artist:</strong> {image.artist}</p>
								<p><strong>Description:</strong> {image.description}</p>
								<p><strong>Uploaded:</strong> {new Date(image.timestamp).toLocaleString()}</p>
							</div>
							))}
					</div>
				)}
		</div>
	);
};
export default memo(ImageGallery);
