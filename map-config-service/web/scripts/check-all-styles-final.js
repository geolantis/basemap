#!/usr/bin/env node

/**
 * Check all map styles from the API for accessibility and URL encoding issues
 */

async function checkStyles() {
  console.log('Fetching map configurations from API...');
  
  try {
    const response = await fetch('https://mapconfig.geolantis.com/api/public/mapconfig?format=legacy&pretty=true');
    const data = await response.json();
    
    let totalMaps = 0;
    let mapsWithSpaces = [];
    let mapsWithEncoding = [];
    let workingStyles = [];
    let failedStyles = [];
    
    // Combine all maps
    const allMaps = {
      ...data.backgroundMaps,
      ...data.overlayMaps
    };
    
    console.log('\n=== ANALYZING URL ENCODING ===');
    
    // First pass: analyze URL encoding
    for (const [key, map] of Object.entries(allMaps)) {
      totalMaps++;
      const url = map.style;
      
      if (!url) {
        failedStyles.push({
          key,
          name: map.name,
          issue: 'No style URL'
        });
        continue;
      }
      
      // Check for spaces in URL
      if (url.includes(' ')) {
        mapsWithSpaces.push({
          key,
          name: map.name,
          url
        });
      }
      
      // Check for %20 encoding
      if (url.includes('%20')) {
        mapsWithEncoding.push({
          key,
          name: map.name,
          url
        });
      }
    }
    
    console.log(`Total maps: ${totalMaps}`);
    console.log(`Maps with spaces in URL: ${mapsWithSpaces.length}`);
    console.log(`Maps with %20 encoding: ${mapsWithEncoding.length}`);
    console.log(`Maps with clean URLs: ${totalMaps - mapsWithSpaces.length - mapsWithEncoding.length}`);
    
    if (mapsWithSpaces.length > 0) {
      console.log('\n❌ URLS WITH SPACES (Need fixing):');
      mapsWithSpaces.forEach(m => {
        console.log(`  • ${m.key} (${m.name})`);
        console.log(`    ${m.url}`);
      });
    }
    
    if (mapsWithEncoding.length > 0) {
      console.log('\n✅ URLS WITH %20 (Correctly encoded):');
      mapsWithEncoding.forEach(m => {
        console.log(`  • ${m.key} (${m.name})`);
        console.log(`    ${m.url}`);
      });
    }
    
    // Second pass: test accessibility
    console.log('\n=== TESTING STYLE ACCESSIBILITY ===');
    console.log('Testing each style URL...\n');
    
    let testCount = 0;
    for (const [key, map] of Object.entries(allMaps)) {
      testCount++;
      process.stdout.write(`Testing ${testCount}/${totalMaps}: ${key}...`);
      
      if (!map.style) {
        process.stdout.write(' ✗ No URL\n');
        continue;
      }
      
      try {
        // Test the URL as provided
        const testResponse = await fetch(map.style, { method: 'HEAD' });
        
        if (testResponse.ok) {
          workingStyles.push({
            key,
            name: map.name,
            url: map.style
          });
          process.stdout.write(' ✓\n');
        } else if (testResponse.status === 404 && map.style.includes(' ')) {
          // If 404 and has spaces, try with %20 encoding
          const encodedUrl = map.style.replace(/ /g, '%20');
          const encodedResponse = await fetch(encodedUrl, { method: 'HEAD' });
          
          if (encodedResponse.ok) {
            workingStyles.push({
              key,
              name: map.name,
              url: encodedUrl,
              note: 'Works with %20 encoding'
            });
            process.stdout.write(' ✓ (with %20)\n');
          } else {
            failedStyles.push({
              key,
              name: map.name,
              url: map.style,
              status: testResponse.status,
              encodedStatus: encodedResponse.status,
              issue: 'Not found even with encoding'
            });
            process.stdout.write(` ✗ (${testResponse.status})\n`);
          }
        } else {
          failedStyles.push({
            key,
            name: map.name,
            url: map.style,
            status: testResponse.status,
            issue: `HTTP ${testResponse.status}`
          });
          process.stdout.write(` ✗ (${testResponse.status})\n`);
        }
      } catch (error) {
        failedStyles.push({
          key,
          name: map.name,
          url: map.style,
          issue: error.message
        });
        process.stdout.write(` ✗ (${error.message})\n`);
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Working styles: ${workingStyles.length}/${totalMaps} (${(workingStyles.length/totalMaps*100).toFixed(1)}%)`);
    console.log(`❌ Failed styles: ${failedStyles.length}/${totalMaps} (${(failedStyles.length/totalMaps*100).toFixed(1)}%)`);
    
    if (failedStyles.length > 0) {
      console.log('\n=== FAILED STYLES DETAILS ===');
      
      // Group by issue type
      const byIssue = {};
      failedStyles.forEach(s => {
        const issue = s.issue || 'Unknown';
        if (!byIssue[issue]) byIssue[issue] = [];
        byIssue[issue].push(s);
      });
      
      for (const [issue, styles] of Object.entries(byIssue)) {
        console.log(`\n${issue} (${styles.length} styles):`);
        styles.forEach(s => {
          console.log(`  • ${s.key} (${s.name})`);
          if (s.url) console.log(`    URL: ${s.url}`);
          if (s.status) console.log(`    Status: ${s.status}`);
        });
      }
    }
    
    // Recommendations
    if (mapsWithSpaces.length > 0) {
      console.log('\n=== RECOMMENDATIONS ===');
      console.log('1. Update API to encode spaces as %20 in all style URLs');
      console.log('2. Consider renaming files to avoid spaces entirely');
      console.log('3. Update database entries with properly encoded URLs');
      console.log(`4. Affected maps: ${mapsWithSpaces.map(m => m.key).join(', ')}`);
    }
    
    // Export results for further processing
    const results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalMaps,
        working: workingStyles.length,
        failed: failedStyles.length,
        withSpaces: mapsWithSpaces.length,
        withEncoding: mapsWithEncoding.length
      },
      failedStyles,
      mapsWithSpaces,
      mapsWithEncoding
    };
    
    // Save results to file
    const fs = require('fs').promises;
    const outputPath = './style-check-results.json';
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error checking styles:', error);
    process.exit(1);
  }
}

// Run the check
checkStyles().catch(console.error);